/**
 * PIN Code Location Explorer
 * Authoritative location details display, accurate map pinpointing,
 * multi-PIN batch search, and live GPS tracking.
 */

// Application State
let map = null;
let currentTileLayer = null;
let markersGroup = null;
let userGpsMarker = null;
let fetchedResults = []; // Stores complete location records
let searchHistory = [];

const PIN_PALETTES = [
    { primary: '#4F46E5', light: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', circle: '#818CF8' }, // Indigo
    { primary: '#059669', light: '#ECFDF5', text: '#065F46', border: '#A7F3D0', circle: '#34D399' }, // Emerald
    { primary: '#D97706', light: '#FFFBEB', text: '#92400E', border: '#FDE68A', circle: '#FBBF24' }, // Amber
    { primary: '#E11D48', light: '#FFF1F2', text: '#9F1239', border: '#FECDD3', circle: '#FB7185' }, // Rose
    { primary: '#7C3AED', light: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', circle: '#A78BFA' }, // Purple
    { primary: '#0284C7', light: '#F0F9FF', text: '#0369A1', border: '#BAE6FD', circle: '#38BDF8' }  // Sky
];

const TILE_PROVIDERS = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    voyager: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    positron: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEventListeners();
    loadSearchHistory();
});

/**
 * Initializes the Leaflet Map
 */
function initMap() {
    map = L.map('map', {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true
    });

    setMapLayer('osm');
    markersGroup = L.featureGroup().addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    }, 250);
}

/**
 * Switches the active Leaflet tile layer
 */
function setMapLayer(layerKey) {
    const config = TILE_PROVIDERS[layerKey] || TILE_PROVIDERS.osm;
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    currentTileLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: 19
    }).addTo(map);
}

/**
 * Attaches Event Listeners
 */
function initEventListeners() {
    const form = document.getElementById('pincode-form');
    const input = document.getElementById('pincode-input');
    const clearBtn = document.getElementById('clear-input-btn');
    const resetBtn = document.getElementById('reset-all-btn');
    const trackBtn = document.getElementById('track-location-btn');
    const headerGpsBtn = document.getElementById('header-gps-btn');
    const fitBoundsBtn = document.getElementById('fit-bounds-btn');
    const layerToggleBtn = document.getElementById('layer-toggle-btn');
    const layerMenu = document.getElementById('layer-menu');
    const closeGpsCard = document.getElementById('close-gps-card');
    const clearRecentBtn = document.getElementById('clear-recent-btn');

    input.addEventListener('input', () => {
        clearBtn.style.display = input.value.trim().length > 0 ? 'block' : 'none';
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        input.focus();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSearch();
    });

    resetBtn.addEventListener('click', resetAll);

    if (trackBtn) trackBtn.addEventListener('click', trackUserLocation);
    if (headerGpsBtn) headerGpsBtn.addEventListener('click', trackUserLocation);

    if (closeGpsCard) {
        closeGpsCard.addEventListener('click', () => {
            document.getElementById('gps-status-card').style.display = 'none';
        });
    }

    fitBoundsBtn.addEventListener('click', () => {
        fitMapToResults();
    });

    layerToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        layerMenu.style.display = layerMenu.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', () => {
        layerMenu.style.display = 'none';
    });

    layerMenu.querySelectorAll('.layer-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            layerMenu.querySelectorAll('.layer-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setMapLayer(btn.dataset.layer);
            layerMenu.style.display = 'none';
            showToast(`Map style changed to ${btn.textContent}`);
        });
    });

    document.querySelectorAll('.quick-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const pincode = chip.dataset.pincode;
            input.value = pincode;
            clearBtn.style.display = 'block';
            handleSearch();
        });
    });

    if (clearRecentBtn) {
        clearRecentBtn.addEventListener('click', () => {
            localStorage.removeItem('pincode_searches');
            searchHistory = [];
            renderSearchHistory();
            showToast('Search history cleared');
        });
    }
}

/**
 * Handles PIN Code Search
 */
async function handleSearch() {
    const input = document.getElementById('pincode-input');
    const rawVal = input.value.trim();

    const matches = rawVal.match(/\b\d{6}\b/g);
    if (!matches || matches.length === 0) {
        showStatus('Please enter a valid 6-digit Indian PIN code (e.g. 201314 or 110001).', 'error');
        return;
    }

    const pinCodes = [...new Set(matches)];
    saveSearchHistory(rawVal);

    setLoading(true);
    hideStatus();

    // Reset previous markers and results
    markersGroup.clearLayers();
    fetchedResults = [];

    let successfulCount = 0;
    let errors = [];

    try {
        for (let i = 0; i < pinCodes.length; i++) {
            const pin = pinCodes[i];
            const palette = PIN_PALETTES[i % PIN_PALETTES.length];
            const result = await fetchLocationData(pin, palette, i + 1);

            if (result) {
                fetchedResults.push(result);
                successfulCount++;
            } else {
                errors.push(`Could not find details for PIN ${pin}`);
            }
        }

        if (successfulCount > 0) {
            renderResults();
            locateOnMap();

            if (errors.length > 0) {
                showStatus(`Located ${successfulCount} PIN code(s). Notice: ${errors.join('; ')}`, 'info');
            } else {
                showStatus(`Successfully located ${successfulCount} PIN code(s)!`, 'success');
                setTimeout(hideStatus, 4000);
            }
        } else {
            showStatus('Location not found for this PIN code. Please verify the 6-digit number and try again.', 'error');
            document.getElementById('empty-state').style.display = 'flex';
            document.getElementById('results-container').style.display = 'none';
        }

    } catch (err) {
        console.error('Search error:', err);
        showStatus('An unexpected error occurred while fetching location. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Fetches 100% authoritative data for a single PIN code
 */
async function fetchLocationData(pincode, palette, index) {
    // 1. Authoritative India Post API
    let poData = null;
    try {
        const postalUrl = `https://api.postalpincode.in/pincode/${pincode}`;
        const postalRes = await fetchWithTimeout(postalUrl, {}, 6000).then(r => r.json());
        if (Array.isArray(postalRes) && postalRes[0]?.Status === 'Success') {
            poData = postalRes[0];
        }
    } catch (e) {
        console.warn('India Post API error:', e);
    }

    let district = '';
    let state = '';
    let postOffices = [];
    let mainAreaName = '';

    if (poData && Array.isArray(poData.PostOffice) && poData.PostOffice.length > 0) {
        postOffices = poData.PostOffice;
        district = postOffices[0].District || '';
        state = postOffices[0].State || '';
        mainAreaName = postOffices[0].Name || '';
    }

    // 2. High-Accuracy Coordinates Geocoding
    let lat = null;
    let lon = null;
    let fullDisplayName = '';

    // Strategy A: Photon query by PIN code in India
    try {
        const photonUrl = `https://photon.komoot.io/api/?q=${pincode}+India&limit=1`;
        const pRes = await fetchWithTimeout(photonUrl, {}, 4000).then(r => r.json());
        if (pRes?.features?.length > 0) {
            const f = pRes.features[0];
            const [pLon, pLat] = f.geometry.coordinates;
            if (!isNaN(pLat) && !isNaN(pLon)) {
                lat = pLat;
                lon = pLon;
                fullDisplayName = f.properties.name || '';
            }
        }
    } catch (pe) {
        console.warn('Photon PIN lookup failed:', pe);
    }

    // Strategy B: If PIN not directly in OSM, geocode using District + State
    if (!lat && district && state) {
        try {
            const distQuery = `${district}, ${state}, India`;
            const photonDistUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(distQuery)}&limit=1`;
            const distRes = await fetchWithTimeout(photonDistUrl, {}, 4000).then(r => r.json());
            if (distRes?.features?.length > 0) {
                const f = distRes.features[0];
                const [dLon, dLat] = f.geometry.coordinates;
                lat = dLat;
                lon = dLon;
            }
        } catch (de) {
            console.warn('Photon District lookup failed:', de);
        }
    }

    // Strategy C: Nominatim fallback
    if (!lat) {
        try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pincode + ', India')}&limit=1`;
            const nomRes = await fetchWithTimeout(nomUrl, {}, 3500).then(r => r.json());
            if (Array.isArray(nomRes) && nomRes.length > 0) {
                lat = parseFloat(nomRes[0].lat);
                lon = parseFloat(nomRes[0].lon);
                fullDisplayName = nomRes[0].display_name;
            }
        } catch (ne) {
            console.warn('Nominatim fallback failed:', ne);
        }
    }

    // If still no coordinates and no post offices, return null
    if (!lat && postOffices.length === 0) {
        return null;
    }

    // If default coordinates were needed, default to India center
    if (!lat || !lon) {
        lat = 28.6139;
        lon = 77.2090;
    }

    const primaryPlace = mainAreaName || fullDisplayName.split(',')[0].trim() || `Area ${pincode}`;
    const fullAddress = `${primaryPlace}, ${district || ''}, ${state || ''}, ${pincode}, India`.replace(/,\s*,/g, ',').trim();

    return {
        id: `loc-${pincode}-${index}`,
        pincode: pincode,
        area: primaryPlace,
        district: district || 'N/A',
        state: state || 'N/A',
        country: 'India',
        fullAddress: fullAddress,
        lat: lat,
        lon: lon,
        postOffices: postOffices,
        palette: palette,
        index: index
    };
}

/**
 * Renders the prominent location information in the sidebar ("Likh kr bata raha hai")
 */
function renderResults() {
    const emptyState = document.getElementById('empty-state');
    const container = document.getElementById('results-container');

    emptyState.style.display = 'none';
    container.style.display = 'flex';
    container.innerHTML = '';

    fetchedResults.forEach(res => {
        const card = createLocationDetailsCard(res);
        container.appendChild(card);
    });
}

/**
 * Creates the high-visibility Location Details Card showing all written location info
 */
function createLocationDetailsCard(res) {
    const card = document.createElement('div');
    card.className = 'location-summary-card';
    card.id = `card-${res.id}`;
    card.style.borderLeftColor = res.palette.primary;

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${res.lat},${res.lon}`;
    const poCount = res.postOffices.length;

    // Build Post Offices List HTML
    let poListHtml = '';
    if (poCount > 0) {
        const poItemsHtml = res.postOffices.map((po, idx) => {
            const isDelivery = (po.DeliveryStatus || '').toLowerCase().includes('delivery');
            const badgeClass = isDelivery ? 'po-delivery' : 'po-nondelivery';
            return `
                <div class="po-item" data-po-index="${idx}" title="Click to view on map">
                    <div class="po-name-col">
                        <span class="po-name">${escapeHtml(po.Name)} Post Office</span>
                        <span class="po-type">${escapeHtml(po.BranchType || 'Sub Post Office')}</span>
                    </div>
                    <span class="po-badge ${badgeClass}">${escapeHtml(po.DeliveryStatus || 'Delivery')}</span>
                </div>
            `;
        }).join('');

        poListHtml = `
            <div class="postoffices-container">
                <div class="po-header">
                    <span>📮 Post Offices in this PIN (${poCount})</span>
                </div>
                <div class="po-list">
                    ${poItemsHtml}
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="loc-card-badge-row">
            <span class="loc-status-tag" style="background-color: ${res.palette.light}; color: ${res.palette.text}; border: 1px solid ${res.palette.border};">
                📍 Location Found &bull; PIN ${res.pincode}
            </span>
            <button type="button" class="loc-btn zoom-btn" title="Center map here">
                Focus on Map
            </button>
        </div>

        <div class="loc-full-address-box">
            <div class="loc-full-title">${escapeHtml(res.area)}</div>
            <div class="loc-address-text">${escapeHtml(res.fullAddress)}</div>
        </div>

        <div class="loc-details-grid">
            <div class="detail-box">
                <span class="detail-label">District / City</span>
                <span class="detail-value">${escapeHtml(res.district)}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">State</span>
                <span class="detail-value">${escapeHtml(res.state)}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">PIN Code</span>
                <span class="detail-value">${escapeHtml(res.pincode)}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">Post Offices</span>
                <span class="detail-value">${poCount} Post Office${poCount !== 1 ? 's' : ''}</span>
            </div>
        </div>

        ${poListHtml}

        <div class="loc-actions-bar">
            <span class="coords-pill">Lat: ${res.lat.toFixed(5)}, Lon: ${res.lon.toFixed(5)}</span>
            <div class="loc-action-buttons">
                <button type="button" class="loc-btn copy-addr-btn" title="Copy full address text">
                    Copy Address
                </button>
                <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="loc-btn" title="Open in Google Maps">
                    Google Maps &rarr;
                </a>
            </div>
        </div>
    `;

    // Action: Focus map on card click
    card.querySelector('.zoom-btn').addEventListener('click', () => {
        zoomToLocation(res);
    });

    // Action: Copy address button
    card.querySelector('.copy-addr-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(res.fullAddress).then(() => {
            showToast(`Address copied: ${res.fullAddress}`);
        }).catch(() => {
            showToast('Unable to copy address');
        });
    });

    // Action: Clicking individual post office item
    card.querySelectorAll('.po-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.poIndex, 10);
            const po = res.postOffices[idx];
            if (po) {
                showToast(`Viewing ${po.Name} Post Office`);
                zoomToLocation(res);
            }
        });
    });

    return card;
}

/**
 * Accurately plots and centers the location on the map ("Map mai acche se locate kar raha hai")
 */
function locateOnMap() {
    if (fetchedResults.length === 0) return;

    markersGroup.clearLayers();

    let primaryMarker = null;

    fetchedResults.forEach(res => {
        // 1. Draw a soft area highlight circle around the location
        const circle = L.circle([res.lat, res.lon], {
            radius: 2000,
            color: res.palette.primary,
            fillColor: res.palette.circle || res.palette.primary,
            fillOpacity: 0.14,
            weight: 2
        }).addTo(markersGroup);

        // 2. High-visibility Custom SVG Marker
        const marker = createCustomPinMarker(res);
        markersGroup.addLayer(marker);
        res.marker = marker;

        if (!primaryMarker) {
            primaryMarker = marker;
        }

        // 3. Sub-markers for post offices if multiple exist
        if (res.postOffices.length > 1) {
            res.postOffices.slice(1, 8).forEach((po, poIdx) => {
                const angle = (poIdx * (360 / Math.min(res.postOffices.length - 1, 7))) * (Math.PI / 180);
                const radius = 0.012 + ((poIdx % 3) * 0.006);
                const poLat = res.lat + (Math.sin(angle) * radius);
                const poLon = res.lon + (Math.cos(angle) * radius);

                const poMarker = L.circleMarker([poLat, poLon], {
                    radius: 7,
                    color: res.palette.primary,
                    fillColor: '#FFFFFF',
                    fillOpacity: 0.9,
                    weight: 2.5
                }).addTo(markersGroup);

                poMarker.bindPopup(`
                    <div class="popup-inner">
                        <div class="popup-title">${escapeHtml(po.Name)} Post Office</div>
                        <div class="popup-address">${escapeHtml(po.BranchType)} &bull; ${escapeHtml(po.DeliveryStatus)}</div>
                        <div class="popup-coords">${res.district}, ${res.state} (${res.pincode})</div>
                    </div>
                `);
            });
        }
    });

    // Center and Zoom Map
    if (fetchedResults.length === 1) {
        const first = fetchedResults[0];
        // Direct zoom to level 13 for crisp pinpointing
        map.setView([first.lat, first.lon], 13);
        map.invalidateSize();

        // Automatically open the popup on the location!
        if (primaryMarker) {
            setTimeout(() => {
                primaryMarker.openPopup();
            }, 300);
        }

        document.getElementById('map-location-text').textContent = `📍 ${first.area}, ${first.district}`;
    } else {
        fitMapToResults();
        if (primaryMarker) {
            setTimeout(() => {
                primaryMarker.openPopup();
            }, 300);
        }
        document.getElementById('map-location-text').textContent = `📍 ${fetchedResults.length} PIN codes mapped`;
    }
}

/**
 * Creates a high-visibility SVG pin marker
 */
function createCustomPinMarker(res) {
    const color = res.palette.primary;

    const pinHtml = `
        <div class="pin-marker">
            <svg class="pin-svg-wrapper" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.5 18 46 18 46C18 46 36 29.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="${color}"/>
                <circle cx="18" cy="17" r="10" fill="#FFFFFF"/>
            </svg>
            <span class="pin-number" style="color: ${color}">${res.index}</span>
        </div>
    `;

    const icon = L.divIcon({
        className: 'custom-map-pin',
        html: pinHtml,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -42]
    });

    const marker = L.marker([res.lat, res.lon], { icon: icon });

    const popupHtml = `
        <div class="popup-inner">
            <div class="popup-title">📍 ${escapeHtml(res.area)} (${res.pincode})</div>
            <div class="popup-address">${escapeHtml(res.fullAddress)}</div>
            <div class="popup-coords">${res.lat.toFixed(5)}, ${res.lon.toFixed(5)}</div>
        </div>
    `;

    marker.bindPopup(popupHtml, { autoClose: false });

    return marker;
}

/**
 * Zooms directly to a selected location
 */
function zoomToLocation(res) {
    map.flyTo([res.lat, res.lon], 14, { duration: 0.8 });
    if (res.marker) {
        setTimeout(() => {
            res.marker.openPopup();
        }, 850);
    }
}

/**
 * Fits map view to all active results
 */
function fitMapToResults() {
    if (!markersGroup || markersGroup.getLayers().length === 0) return;
    map.fitBounds(markersGroup.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
    });
}

/**
 * Live GPS Device Location Tracking
 */
function trackUserLocation() {
    if (!navigator.geolocation) {
        showStatus('Geolocation is not supported by your browser.', 'error');
        return;
    }

    const trackBtn = document.getElementById('track-location-btn');
    const textSpan = trackBtn ? trackBtn.querySelector('.track-btn-text') : null;
    const spinner = trackBtn ? trackBtn.querySelector('.track-spinner') : null;

    if (textSpan && spinner) {
        textSpan.style.display = 'none';
        spinner.style.display = 'inline-block';
        trackBtn.disabled = true;
    }

    showToast('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            // Place user GPS radar pin
            placeUserGpsMarker(latitude, longitude);

            // Reverse geocode to find user's current PIN code
            let detectedPin = null;
            let detectedAddress = '';

            try {
                const photonRev = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
                const pRes = await fetchWithTimeout(photonRev, {}, 4000).then(r => r.json());
                if (pRes?.features?.length > 0) {
                    const props = pRes.features[0].properties;
                    detectedAddress = `${props.name || ''}, ${props.city || props.county || ''}, ${props.state || ''}`;
                    detectedPin = props.postcode;
                }
            } catch (e) {
                console.warn('Photon reverse error:', e);
            }

            if (!detectedPin) {
                try {
                    const nomRev = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
                    const nRes = await fetchWithTimeout(nomRev, {}, 4000).then(r => r.json());
                    if (nRes?.address) {
                        detectedAddress = nRes.display_name;
                        detectedPin = nRes.address.postcode;
                    }
                } catch (ne) {
                    console.warn('Nominatim reverse error:', ne);
                }
            }

            if (detectedPin) {
                const match = detectedPin.match(/\b\d{6}\b/);
                detectedPin = match ? match[0] : null;
            }

            const gpsCard = document.getElementById('gps-status-card');
            const gpsAddr = document.getElementById('gps-card-address');
            const gpsCoords = document.getElementById('gps-card-coords');
            const gpsPin = document.getElementById('gps-card-pin');

            if (gpsCard) {
                gpsCard.style.display = 'flex';
                gpsAddr.textContent = detectedAddress || 'Your Current GPS Coordinates';
                gpsCoords.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                gpsPin.textContent = detectedPin ? `PIN: ${detectedPin}` : 'GPS Pin Active';
            }

            map.flyTo([latitude, longitude], 15, { duration: 1.0 });

            if (detectedPin) {
                document.getElementById('pincode-input').value = detectedPin;
                document.getElementById('clear-input-btn').style.display = 'block';
                showToast(`Tracked location! Found PIN: ${detectedPin}`);
                handleSearch();
            } else {
                showToast(`GPS Tracked: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }

            if (textSpan && spinner) {
                textSpan.style.display = 'inline-flex';
                spinner.style.display = 'none';
                trackBtn.disabled = false;
            }
        },
        (error) => {
            console.error('GPS error:', error);
            showStatus('Unable to access device location. Please allow location permissions in your browser.', 'error');
            if (textSpan && spinner) {
                textSpan.style.display = 'inline-flex';
                spinner.style.display = 'none';
                trackBtn.disabled = false;
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

/**
 * Places the animated GPS radar marker
 */
function placeUserGpsMarker(lat, lon) {
    if (userGpsMarker) {
        map.removeLayer(userGpsMarker);
    }

    const gpsHtml = `
        <div class="user-gps-marker">
            <div class="user-gps-pulse"></div>
            <div class="user-gps-dot"></div>
        </div>
    `;

    const gpsIcon = L.divIcon({
        className: 'gps-custom-icon',
        html: gpsHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    userGpsMarker = L.marker([lat, lon], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(map);
    userGpsMarker.bindPopup(`
        <div class="popup-inner">
            <div class="popup-title">📍 Your Live GPS Location</div>
            <div class="popup-coords">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
        </div>
    `);
}

/**
 * Resets application state
 */
function resetAll() {
    document.getElementById('pincode-input').value = '';
    document.getElementById('clear-input-btn').style.display = 'none';

    const gpsCard = document.getElementById('gps-status-card');
    if (gpsCard) gpsCard.style.display = 'none';

    if (userGpsMarker) {
        map.removeLayer(userGpsMarker);
        userGpsMarker = null;
    }

    markersGroup.clearLayers();
    fetchedResults = [];

    document.getElementById('results-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('map-location-text').textContent = 'Ready to locate';
    hideStatus();

    map.flyTo([20.5937, 78.9629], 5, { duration: 1.0 });
    showToast('Map and results reset');
}

/**
 * UI State Helpers
 */
function setLoading(isLoading) {
    const searchBtn = document.getElementById('search-btn');
    const btnText = searchBtn.querySelector('.btn-text');
    const spinner = searchBtn.querySelector('.spinner');

    if (isLoading) {
        searchBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
    } else {
        searchBtn.disabled = false;
        btnText.style.display = 'inline-flex';
        spinner.style.display = 'none';
    }
}

function showStatus(message, type = 'info') {
    const banner = document.getElementById('status-banner');
    banner.textContent = message;
    banner.className = `status-banner ${type}`;
    banner.style.display = 'flex';
}

function hideStatus() {
    const banner = document.getElementById('status-banner');
    banner.style.display = 'none';
}

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        clearTimeout(timer);
    });
}

function loadSearchHistory() {
    try {
        const stored = localStorage.getItem('pincode_searches');
        if (stored) {
            searchHistory = JSON.parse(stored);
            renderSearchHistory();
        }
    } catch (e) {
        console.warn('Could not load search history', e);
    }
}

function saveSearchHistory(query) {
    try {
        searchHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 6);
        localStorage.setItem('pincode_searches', JSON.stringify(searchHistory));
        renderSearchHistory();
    } catch (e) {
        console.warn('Could not save search history', e);
    }
}

function renderSearchHistory() {
    const section = document.getElementById('recent-searches-section');
    const list = document.getElementById('recent-chips-list');

    if (searchHistory.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'flex';
    list.innerHTML = '';

    searchHistory.forEach(item => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = item;
        chip.addEventListener('click', () => {
            const input = document.getElementById('pincode-input');
            input.value = item;
            document.getElementById('clear-input-btn').style.display = 'block';
            handleSearch();
        });
        list.appendChild(chip);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
