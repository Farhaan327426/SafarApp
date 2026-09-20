# Safar AI

**Purpose**: Jammu & Kashmir transport assistant MVP.

Safar AI is a lightweight conversational transit assistant designed to provide estimated passenger transport fares, listed corridor schedules, route transit waypoints, and complaint drafting assistance across key transit hubs in Jammu & Kashmir.

---

## 🚦 Current MVP Capabilities

1. **Fare Estimates**
   - Corridors covering Srinagar, Baramulla, Budgam, Anantnag, Jammu, Katra, and regional transit hubs.
   - Vehicle modes: Minibus, Bus, Shared Taxi, Auto Rickshaw, E-Rickshaw.
   - **Explicit Default Vehicle**: When no mode is requested, Safar AI explicitly indicates `Default vehicle: Minibus` with guidance on asking for Shared Taxi or Bus.
2. **Demo Route Lookup**
   - Canonical waypoints and major regional transit interchange points (e.g. Parimpora, Sangrama, Batamaloo, TRC).
3. **Listed Schedules**
   - First departure, typical frequency, and last departure for listed public transit corridors.
4. **Complaint Drafting**
   - Prepares structured passenger grievance summaries (Overcharging, Refused Service, Overloading, Misbehavior, Dangerous Driving).
   - Generates ready-to-copy drafts with `.txt` download and device sharing capabilities.
   - Does **not** file complaints or claim official authority submission.
5. **Multilingual Input Normalization**
   - Supports English, Urdu (اردو), Hindi (हिन्दी), and common Romanized Hindi/Urdu inquiries.
6. **Conversational Follow-ups**
   - Lightweight session memory (`lastOrigin`, `lastDestination`, `lastTransportMode`, `lastIntent`).
   - Natural follow-up inquiries (e.g. *"What about shared taxi?"*, *"What about the last one?"*, *"What about from here to Sopore?"*).
   - Explicit routes in user prompts immediately override previous context.

---

## ⚠️ Current MVP Limitations

- **DEMO Data**: All fares, schedules, and routes are illustrative demo estimates. Never treat as official statutory decrees.
- **No Live GPS / Tracking**: Real-time vehicle positions and live tracking are explicitly unavailable in V1.
- **No Live Traffic**: Travel times are estimated baselines without real-time congestion or roadblock data.
- **No Real-Time Seat Availability**: Does not display live seat counts or booked inventory.
- **No Automatic Authority Submission**: Complaint drafting is strictly an offline personal summary tool; it is not sent to police or transport authorities.
- **No Payments / Ticketing**: Does not process monetary transactions or issue tickets.
- **No Persistent Accounts**: All conversation context is transient and session-based.

---

## 🛠️ How to Run Locally

### 1. Start the Server
```bash
node backend/index.js
```
The server will start at: `http://localhost:3001`

### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:3001
```

### 3. Run Automated Tests
```bash
npm test
```
or run the MVP suite directly:
```bash
node --test tests/safar-mvp.test.js
```

---

## 📡 API Endpoints

- `GET /api/health` — Returns system status, Stage 7 active state, demo data notice, and record counts.
- `POST /api/chat` — Primary unified AI conversational interface.
- `POST /api/fare` — Direct fare lookup service.
- `POST /api/route` — Direct route and waypoint service.
- `POST /api/schedule` — Direct listed timetable service.
- `POST /api/complaint` — Direct complaint drafting assistant.
- `GET /api/locations` — Supported hub list and multilingual aliases.
