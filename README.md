# 🌍 PIN Code Location Finder

<div align="center">

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)

### 📍 Find multiple locations, post offices, coordinates, and live GPS tracking for any Indian PIN code(s) with an interactive map

</div>

## 🌐 Live Demo:  
 👉 (https://pincodelocation.vercel.app/)
 
 
## ✨ Overview

**PIN Code Location Explorer** is a modern and comprehensive web application that allows users to search for single or multiple **6-digit Indian PIN codes** simultaneously to fetch **all** corresponding locations, post offices, and geographic points on an interactive Leaflet map.

Key data surfaced:
- 📌 **High-Accuracy Geocoding**: Verified against official India Post district & state registries.
- 🎯 **Live Device GPS Tracking**: One-click current location tracking with automatic 6-digit PIN code reverse detection.
- 📮 **Official India Post Offices Breakdown**: Branch Type, Delivery Status, District, Division, State.
- 🗺️ **Interactive Multi-Marker Map**: With auto-fit bounds, radar indicator, and layer switcher.
- 📍 **Color-coded Markers & Badges**: Distinguishes multiple PIN codes visually.
- 📋 **1-Click Coordinate & Address Copying**: Fast clipboard access.

---

## 🚀 Key Features

✅ **100% Verified Location Accuracy**: Resolves through authoritative India Post directory and multi-tier geocoders (Nominatim + Photon) with district-level validation.

✅ **Live GPS Device Tracking**: Click "Track GPS" to pinpoint your exact coordinates with an animated radar marker and auto-detect your active PIN code.

✅ **Multi-Location Post Office Mapping**: Plots every single post office under the searched PIN code with its exact details, delivery status, and interactive pins.

✅ **Multi-PIN Code Batch Search**: Enter multiple PIN codes separated by commas (e.g., `110001, 560001, 201314`) to plot and compare locations side-by-side.

✅ **Color-Coded Visual Pinpointing**: Each searched PIN code receives a distinct custom color palette for map pins and result cards.

✅ **Interactive Map Sync**: Clicking any result card pans and zooms smoothly to that pin; clicking a pin highlights its corresponding card in the list.

✅ **Real-Time Results Filtering**: Filter fetched places instantly by name, district, or PIN code without re-fetching.

✅ **Modern Responsive UI**: Professional dashboard layout with glassmorphism touches, search suggestions, recent search history, and mobile responsiveness.

✅ **Map Controls & Layer Switcher**: Easily toggle between OpenStreetMap, CartoDB Voyager, and CartoDB Positron styles, plus 1-click "Fit All" bounds button.


## 🖼️ Project Preview

### 🏠 Main Interface

<p align="center">
<img width="807" height="866" alt="Screenshot 2026-06-20 220651" src="https://github.com/user-attachments/assets/0d7d3b04-52c4-474d-98b1-0ba4b85472e0" />

</p>

### 📍 Search Result with Map

<p align="center">
 <img width="752" height="885" alt="Screenshot 2026-06-20 220711" src="https://github.com/user-attachments/assets/b20943ab-14e1-40ea-9b01-c1e3f92ee5fa" />

</p>


## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| 🌐 HTML5 | Structure of the website |
| 🎨 CSS3 | Styling and responsiveness |
| ⚡ JavaScript | Functionality and API handling |
| 🗺️ Leaflet.js | Interactive maps |
| 🌍 OpenStreetMap | Map tiles and location display |


## 📂 Project Structure

```bash
PIN-Code-Location-Finder/
│
├── index.html      # Main webpage
├── style.css       # Styling file
├── script.js       # Logic and API integration
└── README.md
```

---

## ⚙️ How It Works

1. Enter a **6-digit PIN code**.
2. Click **Find Location**.
3. The application fetches location information.
4. The location is displayed on the screen.
5. An interactive map opens with a marker placed on the corresponding area.


## 📸 Screenshots

### Main Page

```text
Input Box
Find Location Button
Map Area
```

<p align ="center">

<img width="653" height="278" alt="Screenshot 2026-06-20 222732" src="https://github.com/user-attachments/assets/fac77a1a-b559-4d91-81c6-2941caec1cf8" />

</p>

### Result Page

```text
PIN Code: 201314
Dadri, Noida, Gautam Buddha Nagar, India
Map with Marker
```
<p align ="center">

<img width="637" height="253" alt="Screenshot 2026-06-20 222804" src="https://github.com/user-attachments/assets/40dab967-7981-4d72-a5f1-5497b42ea3fe" />


<img width="640" height="566" alt="Screenshot 2026-06-20 222847" src="https://github.com/user-attachments/assets/177c708c-bc28-47ff-8163-bd367b27fc0f" />

</p>


## 💻 Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/PIN-Code-Location-Finder.git
```

### Move to Project Folder

```bash
cd PIN-Code-Location-Finder
```

### Run the Project

Simply open:

```bash
index.html
```

in your browser.


## 🎯 Example

Input:

```text
201314
```

Output:

```text
201314, Dadri, Gautam Buddha Nagar, Uttarpradesh, India
```

with an interactive map and marker.


## 🌟 Future Enhancements

- 🔎 Search history
- ⭐ Favorite PIN codes
- 🌙 Dark mode
- 📱 Better mobile responsiveness
- 📋 Copy location details
- 📍 Current location support
- 🌐 Support for multiple countries
- 🧭 Route navigation feature


## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Open a Pull Request



## 👨‍💻 Author

**Anupam Kumari**

📌 Passionate about Web Development and JavaScript Projects.



<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

Made with ❤️ using HTML, CSS, JavaScript and Leaflet

</div> 

