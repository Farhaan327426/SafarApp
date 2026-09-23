# SafarApp — J&K Smart Transit & Statutory Fare Guide

An offline-first, client-side progressive web application providing statutory passenger transport fares under Government of Jammu & Kashmir Transport Department notifications (**S.O. 126** dated 29 April 2026 and **SRO-97** baseline).

---

## 🚀 Key Features

1. **Statutory Tariff Engine**
   - Official fares under S.O. 126 / SRO-97 across all commercial passenger vehicle categories (Buses, Medium/Mini Buses, Shared Taxis, Petrol Autos, E-Rickshaws, E-Autos, and Tourist Cabs).
   - Authoritative terrain rates (`kashmir-plain`, `kashmir-hill`, `jammu-plain`, `jammu-hill`).
   - High-precision rounding and non-manufacturing statutory safeguards.

2. **Offline-First Synchronization**
   - Serialized background tariff synchronization (`useTariffSync` + `TariffSyncService`).
   - Strict ETag checking, payload schema validation (`tariffs.schema.json`), and localStorage fallback caching.
   - Commuter offline status banner with freshness indicator, offline warning, and manual retry.

3. **Stage-by-Stage Transit Corridors**
   - Canonical regional corridors across Srinagar, Jammu, and national highway routes.
   - Bidirectional stage lookups with verified statutory stage fares.

4. **Commuter QR Pass Generator**
   - Conductor pass generator with cryptographically structured, sorted-key base64 QR payload for offline verification.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Vanilla CSS tokens
- **Icons**: Lucide React
- **QR**: `qrcode`
- **Typing**: TypeScript type declarations (`src/types/transit.d.ts`)
- **Testing**: Node.js native test runner (`node --test`)

---

## 💻 Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```

### 3. Typecheck
```bash
npm run typecheck
```

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```
