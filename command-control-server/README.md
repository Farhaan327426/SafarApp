# SAFAR — Firebase Command & Control Server

This folder contains the complete, standalone **Firebase Command & Control Server & Database Web Portal** for the SAFAR J&K Local Transit application.

## 📁 Directory Structure

```
command-control-server/
├── firebase.json              # Firebase Hosting & Realtime Database config
├── database.rules.json        # Firebase Realtime Database Security Rules
├── .firebaserc                # Firebase CLI project target
├── README.md                  # Documentation & Deployment Guide
└── public/
    ├── index.html             # Command & Control Dashboard Web Portal
    ├── css/
    │   └── admin.css          # Server Dashboard UI Stylesheet
    └── js/
        └── firebase-config.js # Firebase Realtime Database SDK Communication
```

---

## ⚡ Core Capabilities

1. **Remote Transit Regulatory Council Fare Slab Control:**
   - Transport officials edit per-km rates and flat distance slab breakpoints (`0-3km`, `3-5km`, `5-10km`, `10-15km`, `15-20km`).
   - Clicking **Publish to Firebase** immediately writes new fare versions (`/fares/active_config`) to Firebase Realtime Database and broadcasts updates to mobile clients.

2. **Live GPS Telemetry Stream:**
   - Ingests incoming bus location pings (`/trips/{tripId}`) broadcasted from conductors across J&K.
   - Monitors active vehicles, speeds, coordinates (`lat/lng`), and ping freshness.

3. **Multi-Device / Cross-Client Synchronization:**
   - Synchronizes seamlessly with mobile devices via Firebase REST endpoints, WebSockets, and `BroadcastChannel` APIs.

---

## 🚀 Deployment Instructions

### Deploy to Firebase Hosting & Realtime Database:
1. Ensure Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase:
   ```bash
   firebase login
   ```
3. Deploy hosting & rules:
   ```bash
   firebase deploy --only hosting,database
   ```
