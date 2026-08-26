# SAFAR — Production Transit & Compliance Platform

Hardened, production-ready transit fare calculation, route navigation, and regulatory compliance platform for Jammu & Kashmir.

> [!WARNING]
> **SECURITY & SECRET ROTATION NOTICE:**
> If any secrets (API keys, JWT secrets, database credentials, admin PINs) were previously committed to version control in earlier commits or git history, they MUST be rotated immediately in your production dashboards (Stripe, Razorpay, Redis, etc.). All production credentials must strictly be loaded from environment variables via `.env` (refer to `.env.example`). Never commit plaintext `.env` files to git.

## 🚀 Deployment

### Static Hosting (Frontend)
Upload the contents of `frontend/` to any static hosting provider (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

### Backend Server (Node.js / Express / TypeScript)
```bash
cd backend
npm install
npm run build
npm start
```

---

## 🛡️ Admin Protection

The administrative suite (`/admin.html`) is protected by host-level authentication and server-side JWT session validation.

### Example Host Protection Configurations:

#### 1. Netlify Basic Auth (`_headers`)
```
/admin.html
  Basic-Auth: auditor:SrtaRegulated2026!
```

#### 2. Vercel Serverless Password Verification Function (`api/verify-admin.js`)
```javascript
export default function handler(req, res) {
  const { password } = req.body;
  if (password === process.env.ADMIN_SECRET_KEY) {
    return res.status(200).json({ authorized: true, token: "session-auth-token" });
  }
  return res.status(401).json({ authorized: false, message: "Unauthorized" });
}
```

#### 3. Cloudflare Access / Zero Trust
Protect `/admin.html` with Cloudflare Access policies validating authorized transport authority emails via OTP or SSO.

---

## 🗺️ Transit Data & Routes
- Master route dataset loaded from [`frontend/js/routes.js`](frontend/js/routes.js) containing 60+ verified routes across all J&K districts (Srinagar, Jammu, Anantnag, Baramulla, Budgam, Katra, Udhampur, etc.).
- Complete dataset with 500+ granular corridors is available in [`frontend/js/jk-routes-db.js`](frontend/js/jk-routes-db.js).

---

## ⚖️ Regulated Fare Rules Engine
- Official fare schedules located in [`frontend/js/fare-rules.js`](frontend/js/fare-rules.js).
- Regulated vehicle types supported:
  - `MINI_BUS` (SRO-97 / 01-P-MVD)
  - `BIG_BUS` (01-P-MVD)
  - `TATA_MAGIC` (TRC-2026-REG-04)
  - `SHARED_VAN` (TRC-2026-REG-04)
  - `E_RICKSHAW` (EV-MVD-2026-09)
  - `E_AUTO` (EV-MVD-2026-14)
  - `PETROL_AUTO` (SRO-97-MVD-2021)
  - `TAXI_MAXI_CAB_BASE` (TC-2026-MAXI-11)
  - `TAXI_MEDIUM_TOURIST` (SRO-97-TOURIST-CAB)
  - `TAXI_PREMIUM_TOURIST` (SRO-97-PREMIUM-CAB)
- Returns `null` (`FARE_NOT_AVAILABLE`) if an unregulated vehicle or distance combination is provided.

---

## 📴 Service Worker & Offline Sync
- **Service Worker:** [`frontend/sw.js`](frontend/sw.js) enforces Cache-First for static assets, Network-First for navigation and API calls, and Map Tile caching for CartoDB OpenStreetMap tiles.
- **Offline Bookings:** Bookings made offline are recorded in IndexedDB (`safar_sync` db, `offline_queue` store) and automatically synced via Background Sync API (`safar-offline-queue`) when connectivity is restored.
