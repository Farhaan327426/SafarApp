# J&K First local vehicles App
**Document Title:** SAFAR Technical Specification & Architectural Blueprint  
**Version:** 3.0.1 (Production Spec — Rickshaw Update)  
**Author:** Farhaan Bashir (Senior UI Architect)  
**Last Updated:** August 11, 2026  
**Status:** Production Ready / Approved Architecture  
**Target Region:** Jammu & Kashmir (Kashmir & Jammu Divisions)  
**Target Fleet:** Unorganized Private Transit — Matadors, Mini-Buses, Tata Magic, Tavera/Sumo Maxicabs, Shared Vans, E-Rickshaws  

---

## Table of Contents
1. [Executive Summary & Three Core Pillars](#1-executive-summary--three-core-pillars)
2. [System Overview & Architecture](#2-system-overview--architecture)

4. [User Roles, Authentication & Permissions (RBAC)](#4-user-roles-authentication--permissions-rbac)
5. [Design System & Visual Language](#5-design-system--visual-language)
6. [Fare Engine Detailed Logic & Lookup Matrix](#6-fare-engine-detailed-logic--lookup-matrix)
7. [Hybrid Payment & Compliance Audit Workflow (State Machine)](#7-hybrid-payment--compliance-audit-workflow-state-machine)
8. [Complete API Specification](#8-complete-api-specification)
9. [Data Models & Database Schema (PostgreSQL + PostGIS DDL)](#9-data-models--database-schema-postgresql--postgis-ddl)
10. [Offline Behavior & Caching Strategy](#10-offline-behavior--caching-strategy)
11. [Admin Dashboard & Regulatory Audit System](#11-admin-dashboard--regulatory-audit-system)
12. [Non-Functional Requirements (NFRs)](#12-non-functional-requirements-nfrs)
13. [Testing & Acceptance Criteria](#13-testing--acceptance-criteria)
14. [Deployment, DevOps & Monitoring](#14-deployment-devops--monitoring)
15. [Appendices](#15-appendices)

---

## 1. Executive Summary & Three Core Pillars

SAFAR transforms Jammu & Kashmir's unorganized local bus and mini-bus network into a transparent, compliant, and engagement-first transit ecosystem. While state-run organized E-buses serve fixed city corridors, 85%+ of daily regional commuters rely on private operators where fare disputes, overcharging, and lack of audit trails persist. SAFAR resolves this by establishing an authoritative transit compliance layer.

### The Three Core Pillars

```
+-----------------------------------------------------------------------------------+
|                                 SAFAR PILLARS                                 |
+-----------------------------------+-----------------------------------------------+
| Pillar 1: Transparent Fare        | Boarding Stop -> Deboarding Stop -> Route     |
|    Calculation                    | Segments -> Actual Distance -> Regulated Fare |
+-----------------------------------+-----------------------------------------------+
| Pillar 2: Hybrid Payment          | Digital Locks Fare | Cash Generates Printable |
|    (Cash + Digital)               | Receipt & QR -> Unified Audit Trail           |
+-----------------------------------+-----------------------------------------------+
| Pillar 3: Regulatory Compliance   | Operator Transit Permit Reg -> Auto Discrepancy Detect  |
|    Engine                         | -> Categorized Audit -> Transit Council Export / Emergency Helpline (112)  |
+-----------------------------------+-----------------------------------------------+
```

1. **Pillar 1: Transparent Fare Calculation** — Computed from official J&K State Regional Transport Authority (Transit Regulatory Council) distance slabs and terrain multipliers *before* boarding. Distance is walked along actual road segments rather than straight-line estimates.

2. **Pillar 2: Hybrid Payment (Cash + Digital)** — Digital payment (UPI/Card) locks regulated fare in advance. Cash payments generate a verifiable receipt with a QR code (`RCP-XXXXXX`). Both payment methods feed the exact same audit trail, allowing senior citizens to pay cash without friction while capturing driver compliance metrics.

3. **Pillar 3: Regulatory Compliance Engine** — Every vehicle operator is verified against Transit Regulatory Council registration records. Overcharges are automatically detected, categorized into severity tiers, and exported directly to the transport authority and Emergency Helpline (112), positioning SAFAR as critical public infrastructure.

---

## 2. System Overview & Architecture

SAFAR is built on an offline-first architecture designed to operate seamlessly across high-altitude mountain corridors with intermittent connectivity.

### System Components Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  +--------------------------------+       +-----------------------------------+   |
|  |  SAFAR Mobile Web App      |       |  Safar Admin Suite Dashboard      |   |
|  |  (Vanilla JS / Service Worker) |       |  (Strict Nonce CSP / Subsystem)   |   |
|  +---------------+----------------+       +-----------------+-----------------+   |
+------------------|------------------------------------------|---------------------+
                   | HTTPS / WSS                              | HTTPS / WSS
+------------------v------------------------------------------v---------------------+
|                                 GATEWAY & NETWORK LAYER                           |
|  Reverse Proxy (Nginx) + Rate Limiter + WAF + CSRF Protection + SSL Termination   |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                                 BACKEND SERVICES LAYER                            |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  | Auth & Access Module  |  | Fare Engine Service   |  | Compliance & Audit    |  |
|  | (JWT / RBAC / Salt)   |  | (Haversine / Slabs)   |  | (Discrepancy Engine)  |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                                 DATA & CACHE LAYER                                |
|  +-------------------------------------+   +-----------------------------------+  |
|  | PostgreSQL + PostGIS (Spatial Data) |   | Redis (Session / Fare Slab Cache) |  |
|  +-------------------------------------+   +-----------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                               EXTERNAL INTEGRATIONS                               |
|  +-------------------------------------+   +-----------------------------------+  |
|  | Emergency Support Emergency Helpline (112) Emergency        |   | Transit Regulatory Council Regional Transport Authority |  |
|  +-------------------------------------+   +-----------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Technology Stack
- **Client Side:** HTML5, CSS3 (Vanilla CSS System), JavaScript (ES6+ IIFE Modules), Leaflet 1.9.4 (GPS Tracking Maps).
- **Service Worker:** Offline Blob URL Service Worker with Network-First strategy and cache fallbacks.
- **Backend Service:** Node.js / Express microservices with OpenAPI 3.0 REST interfaces.
- **Database:** PostgreSQL 16 with PostGIS extension for spatial queries and route segment tracing.
- **Cache & Memory Store:** Redis 7.2 for fare slab version caching and session rate limiting.

---

## 3. Competitive Positioning: SAFAR vs. Chalo

Chalo serves official state regulatory E-buses operating on fixed urban corridors. SAFAR serves the private, flexible, and semi-fixed segment (Matadors, Mini-Buses, Shared Vans) that carries 85%+ of J&K transit volume.

### Feature Comparison Matrix

| Capability | SAFAR | Chalo (Gov't E-Bus) |
| :--- | :--- | :--- |
| **Fleet Coverage** | Matadors, Mini-Buses, Tata Magic, Shared Vans | Regulatory E-Buses (Regional Transit Board) |
| **Route Architecture** | Semi-fixed, informal, private operator routes | Fixed urban Transit Permit routes |
| **Payment Model** | **Hybrid** (Cash audit trail + Digital UPI/Card) | Digital-first QR ticketing |
| **Offline Operation** | **Offline-First** (Local cached Transit Regulatory Council slabs) | Network dependent |
| **Fare Overcharge Audit** | **Auto-detected severity classification** | Not applicable (fixed fare) |
| **Senior Citizen Support** | **Print Receipts + SMS + IVR Hotline** | Standard mobile app |
| **Regulatory Export** | **JSON & CSV Audit Export for Transit Regulatory Council / Emergency Helpline (112)** | Internal analytics only |
| **Vehicle Multipliers** | **5 Transit Regulatory Council vehicle class multipliers (1.0x to 1.25x)** | Single vehicle class |
| **Conductor Verification** | **Dual Mode** (Pre-paid verification & Cash collector) | QR Pass scanner only |
| **GPS Auto-Detection** | **Both Boarding & Deboarding points** | Boarding point only |
| **Terrain Multipliers** | **Kashmir & Jammu Plain vs. Hilly Slabs** | Uniform city rates |
| **AI Transit Copilot** | **Multilingual (English, Kashmiri, Hindi)** | None |
| **Dispute Escalation** | **One-tap report to Emergency Support Desk (112)** | Customer care email |
| **Operator Scoring** | **Compliance leaderboard & inspection flags** | N/A |

---

## 4. User Roles, Authentication & Permissions (RBAC)

### Role Taxonomy
1. **Commuter (Anonymous / Semi-Identified):** Access to fare calculator, live tracking, booking, dispute logger, and AI assistant.
2. **Conductor / Driver:** Access to driver console, live GPS broadcasting, passenger occupancy counter, and receipt validation scanner.
3. **Regulatory Auditor (Transit Regulatory Council):** Read-only access to compliance dashboards, discrepancy logs, and JSON/CSV audit exports.
4. **Administrator:** Access to fare slab updates, route management, operator registration, and account lockouts.
5. **Super Admin:** Master system configuration, tenant isolation, and cryptographic key management.

### Access Control Matrix

| Resource / Endpoint | Commuter | Conductor | Auditor | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /api/v1/fare/calculate` | Read | Read | Read | Read | Read |
| `POST /api/v1/booking/create` | Write | — | — | — | — |
| `POST /api/v1/payment/confirm` | Write | — | — | — | — |
| `GET /api/v1/conductor/verify/:code` | — | Read | Read | Read | Read |
| `PUT /api/v1/admin/fare-slabs` | — | — | — | Write | Write |
| `GET /api/v1/compliance/audit-report` | — | — | Read | Read | Read |
| `GET /api/v1/compliance/violations/csv` | — | — | Read | Read | Read |
| `POST /api/v1/sos/trigger` | Write | Write | — | — | — |
| `POST /api/v1/auth/login` | All | All | All | All | All |
| `POST /api/v1/auth/refresh` | All | All | All | All | All |
| `POST /api/v1/auth/logout` | All | All | All | All | All |
| `GET /api/v1/routes` | Read | Read | Read | Read | Read |

### Authentication Architecture
- **Tokens:** Dual Token Scheme — Short-lived JWT Access Token (`15 minutes`) and HttpOnly Refresh Cookie (`7 days`).
- **PBKDF2 Client-Side Hashing:** Passwords hashed with SHA-256 and 100,000 iterations before network transmission; memory zeroed post-call.
- **Lockout Policy:** 5 consecutive failed login attempts trigger an automated 30-second lockout.

### 4.1 Session Management & Token Lifecycle

#### Token Pair Architecture

| Token | Type | Lifetime | Storage | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Access Token** | JWT (RS256) | 15 minutes | In-memory (JS variable) | Authorize API requests via `Authorization: Bearer` header |
| **Refresh Token** | Opaque (256-bit random) | 7 days | HttpOnly, Secure, SameSite=Strict cookie | Obtain new access tokens without re-authentication |

#### Refresh Token Flow

```
Client                                   Server
  |                                         |
  |--- POST /api/v1/auth/login ------------>|
  |    { phone, password_hash }             |
  |                                         |--- Validate credentials
  |                                         |--- Generate access_token (JWT, 15m)
  |                                         |--- Generate refresh_token (opaque, 7d)
  |                                         |--- Store refresh_token hash in sessions table
  |<-- 200 { access_token, expires_in } ----|
  |    Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
  |                                         |
  |  ... 15 minutes later ...               |
  |                                         |
  |--- POST /api/v1/auth/refresh ---------->|
  |    Cookie: refresh_token=abc123         |
  |                                         |--- Lookup refresh_token_hash in sessions
  |                                         |--- Validate not expired, not revoked
  |                                         |--- Rotate: invalidate old token, issue new pair
  |<-- 200 { access_token, expires_in } ----|
  |    Set-Cookie: refresh_token=NEW; HttpOnly; Secure; SameSite=Strict
```

#### Token Rotation Policy

Every time a refresh token is used, it is **rotated**:

1. The server marks the old `refresh_token_hash` as `revoked` in the `sessions` table.
2. A new `refresh_token` is generated, hashed, and stored.
3. If a **revoked** refresh token is presented (replay attack), the server **invalidates all sessions** for that user and returns `401 SESSION_COMPROMISED`.

#### Logout & Session Invalidation

| Action | Mechanism |
| :--- | :--- |
| **Single device logout** | `POST /api/v1/auth/logout` — Revokes the refresh token from the cookie; clears the HttpOnly cookie. |
| **All device logout** | `POST /api/v1/auth/logout-all` — Marks all `sessions` rows for the user as `revoked = TRUE`. |
| **Admin forced logout** | Admin calls `DELETE /api/v1/admin/users/:id/sessions` — Revokes all sessions for a target user. |
| **Automatic expiry** | A cron job purges `sessions` where `expires_at < NOW()` every 6 hours. |

---

## 5. Design System & Visual Language

SAFAR utilizes a glassmorphic dark canvas paired with dual-tone gradient accents inspired by J&K's landscape (Pine Green from Chinar forests, Saffron Gold from Kashmir fields, Alpine Sky Blue from mountain lakes).

### Color Tokens

```css
:root {
  --primary:        #14b8a6;
  --primary-hover:  #0f766e;
  --saffron:        #f59e0b;
  --sky-blue:       #38bdf8;
  --indigo:         #6366f1;
  --danger:         #dc2626;
  --bg-dark:        #070a12;
  --bg-dark-raised: #0d1322;
  --card-dark:      rgba(15, 23, 42, 0.72);
  --card-border:    rgba(255, 255, 255, 0.08);
  --grad-fare:      linear-gradient(135deg, #0f766e, #14b8a6);
  --grad-pass:      linear-gradient(135deg, #c2410c, #f59e0b);
  --grad-track:     linear-gradient(135deg, #1e3a8a, #0284c7);
  --grad-sos:       linear-gradient(135deg, #b91c1c, #dc2626);
}
```

### Typography Hierarchy
- **Headings & Display:** `Outfit` (Weights: 700, 800, 900)
- **UI & Body:** `Inter` (Weights: 400, 500, 600, 700)
- **Brand Subtitles:** `Plus Jakarta Sans` (Weights: 700, 800)

### Senior Citizen Mode Specifications
When `Senior Citizen / PwD` concession is active:
- Minimum touch target size increases from `44px` to `56px`.
- Base text font size enlarges to `16px`.
- Calculated fare display text scales to `36px`.
- Cash payment is selected as default payment method.
- Senior Print Receipt CTA is prominently displayed.

---

## 6. Fare Engine Detailed Logic & Lookup Matrix

### Input Parameters
- `region`: `"Kashmir"` | `"Jammu"`
- `terrain`: `"plain"` | `"hilly"`
- `distance_km`: `float`
- `vehicle_type`: `"matador"` (1.0x) | `"minibus"` (1.0x) | `"tatamagic"` (1.10x) | `"sharedvan"` (1.15x) | `"ebus"` (1.15x) | `"tavera"` (1.25x)
- `concession_pct`: `0` | `25` (Senior) | `50` (Student / PwD)

### Transit Regulatory Council Regulated Slab Lookup Table (V20260809)

| Distance Band | Kashmir Plain | Kashmir Hilly | Jammu Plain | Jammu Hilly |
| :--- | :---: | :---: | :---: | :---: |
| **0.0 - 3.0 km** | 9.00 | 10.00 | 9.00 | 10.00 |
| **3.1 - 5.0 km** | 14.00 | 15.00 | 13.00 | 15.00 |
| **5.1 - 10.0 km** | 17.00 | 18.00 | 16.00 | 19.00 |
| **10.1 - 15.0 km** | 20.00 | 22.00 | 19.00 | 23.00 |
| **15.1 - 20.0 km** | 26.00 | 28.00 | 25.00 | 29.00 |

### Per-Km Excess Rates (over 20.0 km)
- **Kashmir Plain Rate:** 1.40 / km
- **Kashmir Hilly Rate:** 1.70 / km
- **Jammu Plain Rate:** 1.35 / km
- **Jammu Hilly Rate:** 1.65 / km

Formula: `Total = Slab_20km + ((Distance - 20) * Rate_per_km)`

### Haversine Distance Formula for GPS Stops
`Haversine(d) = 2r * arcsin(sqrt(sin^2(dphi/2) + cos(phi1)*cos(phi2)*sin^2(dlambda/2)))` where r = 6371 km.

---

## 7. Hybrid Payment & Compliance Audit Workflow (State Machine)

### State Machine Lifecycle

```
[Booking Created] ---> (status: 'pending_payment' / 'cash_expected')
                                |
                +---------------+---------------+
                |                               |
        [Digital UPI Locked]           [Cash Paid to Driver]
                |                               |
        (status: 'completed')           (status: 'completed')
                |                               |
                +---------------+---------------+
                                |
                     [Post-Trip Payment Audit]
                                |
             +------------------+------------------+
             |                                     |
   Diff <= 25 Paise                       Diff > 25 Paise
   (status: 'compliant')                  (status: 'violated')
                                                   |
                                       [Emergency Helpline (112) / Transit Regulatory Council Flag]
```

### Overcharge Severity Matrix

| Discrepancy Amount | Severity Category | Compliance Status | System Action |
| :--- | :--- | :--- | :--- |
| **0 Paise** | `none` | `compliant` | Log trip as compliant |
| **1 - 5 Paise** | `rounding_variance` | `compliant` | Filter noise; log compliant |
| **6 - 25 Paise** | `minor_overcharge` | `under_investigation` | Log warning; track operator score |
| **> 25 Paise** | `major_overcharge` | `violated` | Flag violation; prompt Emergency Helpline (112) report |

---

## 8. Complete API Specification

### Base URL & Versioning
- **Production Base URL:** `https://api.safar.jk.gov.in/api/v1`
- **Staging Base URL:** `https://staging-api.safar.jk.gov.in/api/v1`

### Standard Headers

| Header | Value | Required |
| :--- | :--- | :---: |
| `Authorization` | `Bearer <access_token>` | For protected endpoints |
| `Content-Type` | `application/json` | For POST/PUT requests |
| `Accept` | `application/json` | All requests |
| `X-CSRF-Token` | CSRF token from login | For state-changing requests |
| `X-Request-ID` | UUID v4 | Optional (for tracing) |

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DISTANCE",
    "message": "Distance must be a positive number between 0.1 and 500 km.",
    "details": [{ "field": "distanceKm", "issue": "value_out_of_range" }]
  },
  "timestamp": "2026-08-10T19:45:00Z"
}
```

### Standard HTTP Status Codes

| Status | Meaning | When Used |
| :--- | :--- | :--- |
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST that creates a resource |
| `400` | Bad Request | Validation failure, malformed body |
| `401` | Unauthorized | Missing, expired, or invalid access token |
| `403` | Forbidden | Valid token but insufficient role permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (e.g. receipt code collision) |
| `422` | Unprocessable Entity | Semantically invalid request |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server failure |

---

### 8.1 API Pagination & Filtering Convention

All list endpoints follow a standardized pagination and filtering interface.

#### Standard Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `page` | integer | No | `1` | 1-indexed page number |
| `limit` | integer | No | `20` | Items per page. Min: `1`, Max: `100` |
| `sort_by` | string | No | `created_at` | Column to sort by (endpoint-specific) |
| `order` | string | No | `desc` | Sort direction: `asc` or `desc` |

#### Standard Pagination Response Envelope

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 142,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Common Filter Parameters

| Parameter | Applicable Endpoints | Type | Description |
| :--- | :--- | :--- | :--- |
| `region` | routes, audit-report, violations | string | Filter by `Kashmir` or `Jammu` |
| `terrain` | routes | string | Filter by `plain` or `hilly` |
| `status` | audit-report, violations | string | Filter by compliance status |
| `severity` | audit-report, violations | string | Filter by severity tier |
| `date_from` | audit-report, violations | ISO 8601 | Start of date range (inclusive) |
| `date_to` | audit-report, violations | ISO 8601 | End of date range (inclusive) |
| `operator_id` | audit-report, violations | UUID | Filter by specific operator |
| `search` | routes | string | Full-text search on route name/origin/destination |

---

### Endpoints Detail

#### 1. `GET /api/v1/fare/calculate`

Computes official fare for specified route parameters.

- **Authentication:** None required (public endpoint).
- **Rate Limit:** 60 requests/minute per IP.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `region` | string | Yes | — | `Kashmir` or `Jammu` |
| `terrain` | string | Yes | — | `plain` or `hilly` |
| `distanceKm` | number | Yes | — | Distance in km (`0.1` to `500.0`) |
| `vehicleType` | string | Yes | — | `matador`, `minibus`, `tatamagic`, `sharedvan`, `ebus`, `tavera` |
| `concessionPct` | number | No | `0` | `0`, `25`, or `50` |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalFareRupees": 14,
    "totalFarePaise": 1400,
    "slabDetails": "Distance 14.0 km (Up to 15km slab)",
    "fareVersionTag": "V20260809",
    "breakdown": {
      "baseSlabFare": 20.00,
      "vehicleMultiplier": 1.0,
      "concessionDiscount": 0.0
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DISTANCE",
    "message": "Distance must be a positive number between 0.1 and 500 km.",
    "details": [{ "field": "distanceKm", "issue": "value_out_of_range" }]
  },
  "timestamp": "2026-08-10T19:45:00Z"
}
```

**Example Call:**

```bash
curl -X GET "https://api.safar.jk.gov.in/api/v1/fare/calculate?region=Kashmir&terrain=plain&distanceKm=14&vehicleType=matador" \
  -H "Accept: application/json"
```

---

#### 2. `POST /api/v1/booking/create`

Creates a hybrid trip booking.

- **Authentication:** `Bearer <access_token>` required. Role: `COMMUTER`.
- **Rate Limit:** 10 requests/minute per user.

**Request Body:**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `route_id` | string | Yes | Route code from the routes master |
| `boarding_stop` | string | Yes | Name of the boarding stop |
| `deboarding_stop` | string | Yes | Name of the deboarding stop |
| `distance_km` | number | Yes | Calculated distance in km |
| `calculated_fare_rupees` | number | Yes | Fare computed by the fare engine |
| `payment_method` | string | Yes | `cash`, `upi`, `card`, `wallet`, `pass` |

```json
{
  "route_id": "srn-budgam",
  "boarding_stop": "Lal Chowk",
  "deboarding_stop": "Budgam Stand",
  "distance_km": 14.0,
  "calculated_fare_rupees": 14.00,
  "payment_method": "cash"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "booking_id": "bk-998231",
    "trip_id": "TRIP-20260810-091",
    "receipt_code": "RCP-X9Y8Z7",
    "qr_code_payload": "SAFAR_TRIP:TRIP-20260810-091:RCP-X9Y8Z7:1400",
    "payment_status": "cash_expected"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ROUTE",
    "message": "The specified route_id does not exist in the routes master.",
    "details": [{ "field": "route_id", "issue": "not_found", "value": "invalid-route-xyz" }]
  },
  "timestamp": "2026-08-10T19:46:00Z"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired. Use POST /api/v1/auth/refresh to obtain a new token."
  },
  "timestamp": "2026-08-10T19:46:00Z"
}
```

**Example Call:**

```bash
curl -X POST "https://api.safar.jk.gov.in/api/v1/booking/create" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: csrf-token-value" \
  -d '{"route_id":"srn-budgam","boarding_stop":"Lal Chowk","deboarding_stop":"Budgam Stand","distance_km":14.0,"calculated_fare_rupees":14.00,"payment_method":"cash"}'
```

---

#### 3. `POST /api/v1/payment/confirm`

Submits post-trip payment audit. Triggers overcharge detection.

- **Authentication:** `Bearer <access_token>` required. Role: `COMMUTER`.
- **Rate Limit:** 10 requests/minute per user.

**Request Body:**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `trip_id` | string | Yes | Trip identifier from booking creation |
| `actual_paid_rupees` | number | Yes | Amount the commuter actually paid (in INR) |

```json
{
  "trip_id": "TRIP-20260810-091",
  "actual_paid_rupees": 20.00
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "compliance_status": "violated",
    "severity": "major_overcharge",
    "overcharge_amount_rupees": 6.00,
    "prompt_user_report": true,
    "dispute_id": "dsp-44821"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRIP",
    "message": "Trip ID not found or payment already confirmed.",
    "details": [{ "field": "trip_id", "issue": "not_found_or_already_confirmed" }]
  },
  "timestamp": "2026-08-10T19:47:00Z"
}
```

**Example Call:**

```bash
curl -X POST "https://api.safar.jk.gov.in/api/v1/payment/confirm" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"trip_id":"TRIP-20260810-091","actual_paid_rupees":20.00}'
```

---

#### 4. `GET /api/v1/conductor/verify/:code`

Verifies a receipt code or QR payload for the conductor console. Returns trip status, fare details, and conductor instruction.

- **Authentication:** `Bearer <access_token>` required. Role: `CONDUCTOR`, `AUDITOR`, `ADMIN`, or `SUPER_ADMIN`.
- **Rate Limit:** 120 requests/minute per user.

**URL Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `code` | string | Yes | Receipt code (e.g. `RCP-X9Y8Z7`) or full QR payload string |

**Success Response (200 OK) — Valid Pre-Paid Receipt:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "trip_id": "TRIP-20260810-091",
    "receipt_code": "RCP-X9Y8Z7",
    "payment_method": "upi",
    "payment_status": "completed",
    "calculated_fare_rupees": 14.00,
    "boarding_stop": "Lal Chowk",
    "deboarding_stop": "Budgam Stand",
    "route_name": "Srinagar - Budgam",
    "status_label": "FARE PRE-PAID (Digital UPI)",
    "conductor_instruction": "Passenger has pre-paid Rs 14.00 via UPI. No cash collection required. Verify boarding point."
  }
}
```

**Success Response (200 OK) — Valid Cash-Expected Receipt:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "trip_id": "TRIP-20260810-092",
    "receipt_code": "RCP-A1B2C3",
    "payment_method": "cash",
    "payment_status": "cash_expected",
    "calculated_fare_rupees": 20.00,
    "boarding_stop": "Rambagh",
    "deboarding_stop": "Hyderpora",
    "route_name": "Srinagar - Budgam",
    "status_label": "CASH EXPECTED",
    "conductor_instruction": "Collect exactly Rs 20.00 in cash. Issue printed receipt to passenger. Do NOT overcharge."
  }
}
```

**Success Response (200 OK) — Invalid / Not Found:**

```json
{
  "success": true,
  "data": {
    "valid": false,
    "message": "Receipt code 'RCP-ZZZZZZ' not found or has expired. Please ask passenger for a valid code."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "A valid Bearer token with CONDUCTOR, AUDITOR, or ADMIN role is required."
  },
  "timestamp": "2026-08-10T19:48:00Z"
}
```

**Example Call:**

```bash
curl -X GET "https://api.safar.jk.gov.in/api/v1/conductor/verify/RCP-X9Y8Z7" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Accept: application/json"
```

---

#### 5. `GET /api/v1/routes`

Fetches the master route network with full pagination, filtering, and search.

- **Authentication:** None required (public endpoint).
- **Rate Limit:** 30 requests/minute per IP.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `page` | integer | No | `1` | Page number (1-indexed) |
| `limit` | integer | No | `20` | Items per page (max `100`) |
| `sort_by` | string | No | `route_code` | `route_code`, `origin_name`, `destination_name`, `total_distance_km`, `created_at` |
| `order` | string | No | `asc` | `asc` or `desc` |
| `region` | string | No | — | Filter: `Kashmir` or `Jammu` |
| `terrain` | string | No | — | Filter: `plain` or `hilly` |
| `search` | string | No | — | Full-text search across `origin_name`, `destination_name`, `route_code` |
| `include_stops` | boolean | No | `false` | If `true`, embeds `stops[]` array with each route |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      "route_code": "srn-budgam",
      "origin_name": "Lal Chowk",
      "destination_name": "Budgam Stand",
      "region": "Kashmir",
      "terrain": "plain",
      "total_distance_km": 14.00,
      "stops": [
        { "stop_name": "Lal Chowk", "stop_sequence": 1, "cumulative_distance_km": 0.00 },
        { "stop_name": "Jahangir Chowk", "stop_sequence": 2, "cumulative_distance_km": 1.20 },
        { "stop_name": "Rambagh", "stop_sequence": 3, "cumulative_distance_km": 3.50 },
        { "stop_name": "Hyderpora", "stop_sequence": 4, "cumulative_distance_km": 6.20 },
        { "stop_name": "Humhama", "stop_sequence": 5, "cumulative_distance_km": 9.80 },
        { "stop_name": "Budgam Stand", "stop_sequence": 6, "cumulative_distance_km": 14.00 }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid value for 'region'. Must be 'Kashmir' or 'Jammu'.",
    "details": [{ "field": "region", "issue": "invalid_enum_value", "allowed": ["Kashmir", "Jammu"] }]
  },
  "timestamp": "2026-08-10T19:49:00Z"
}
```

**Example Call:**

```bash
curl -X GET "https://api.safar.jk.gov.in/api/v1/routes?region=Kashmir&terrain=plain&include_stops=true&page=1&limit=10&sort_by=total_distance_km&order=asc" \
  -H "Accept: application/json"
```

---

#### 6. `PUT /api/v1/admin/fare-slabs`

Publishes a new fare slab version. Atomically activates the new version and deactivates the previous one. Records the action in `admin_audit_log`.

- **Authentication:** `Bearer <access_token>` required. Role: `ADMIN` or `SUPER_ADMIN`.
- **Rate Limit:** 5 requests/minute per user.

**Request Body:**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `version_tag` | string | Yes | Unique version identifier (e.g. `V20260901-Transit Regulatory Council`) |
| `effective_from` | ISO 8601 | Yes | Date/time when the new slabs take effect |
| `slabs` | array | Yes | Array of slab objects covering all region x terrain combinations |
| `slabs[].region` | string | Yes | `kashmir` or `jammu` |
| `slabs[].terrain` | string | Yes | `plain` or `hilly` |
| `slabs[].min_distance_km` | number | Yes | Lower bound of distance band (inclusive) |
| `slabs[].max_distance_km` | number | Yes | Upper bound of distance band (exclusive) |
| `slabs[].flat_rate` | number | Conditional | Flat fare. Required if `per_km_rate` is null |
| `slabs[].per_km_rate` | number | Conditional | Per-km excess rate. Required if `flat_rate` is null |

```json
{
  "version_tag": "V20260901-Transit Regulatory Council",
  "effective_from": "2026-09-01T00:00:00Z",
  "slabs": [
    { "region": "kashmir", "terrain": "plain", "min_distance_km": 0.0, "max_distance_km": 3.0, "flat_rate": 10.00, "per_km_rate": null },
    { "region": "kashmir", "terrain": "plain", "min_distance_km": 3.0, "max_distance_km": 5.0, "flat_rate": 15.00, "per_km_rate": null },
    { "region": "kashmir", "terrain": "plain", "min_distance_km": 20.0, "max_distance_km": 999.0, "flat_rate": null, "per_km_rate": 1.50 }
  ]
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "fare_version_id": "e3aabc99-9c0b-4ef8-bb6d-6bb9bd380a77",
    "version_tag": "V20260901-Transit Regulatory Council",
    "total_slabs_created": 24,
    "effective_from": "2026-09-01T00:00:00Z",
    "previous_version_deactivated": "V20260809-Transit Regulatory Council",
    "audit_log_id": "audit-9982"
  }
}
```

**Error Response (400 Bad Request — Incomplete Coverage):**

```json
{
  "success": false,
  "error": {
    "code": "INCOMPLETE_SLAB_COVERAGE",
    "message": "Fare slabs must cover all 4 region x terrain combinations. Missing: jammu/hilly.",
    "details": [{ "field": "slabs", "issue": "missing_region_terrain", "missing": ["jammu/hilly"] }]
  },
  "timestamp": "2026-08-10T19:50:00Z"
}
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Your role (CONDUCTOR) does not have permission to update fare slabs. Required: ADMIN or SUPER_ADMIN."
  },
  "timestamp": "2026-08-10T19:50:00Z"
}
```

**Example Call:**

```bash
curl -X PUT "https://api.safar.jk.gov.in/api/v1/admin/fare-slabs" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: csrf-token-value" \
  -d '{"version_tag":"V20260901-Transit Regulatory Council","effective_from":"2026-09-01T00:00:00Z","slabs":[...]}'
```

---

#### 7. `POST /api/v1/sos/trigger`

Dispatches an emergency distress signal to J&K Emergency Support Desk (Emergency Helpline (112)). Captures live GPS coordinates, the current trip context, and user identity.

- **Authentication:** `Bearer <access_token>` required. Role: `COMMUTER` or `CONDUCTOR`.
- **Rate Limit:** 3 requests/minute per user (abuse prevention).

**Request Body:**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `latitude` | number | Yes | GPS latitude at time of distress |
| `longitude` | number | Yes | GPS longitude at time of distress |
| `trip_id` | string | No | Associated trip ID, if user is currently on a trip |
| `description` | string | No | Free-text description of the emergency (max 500 chars) |

```json
{
  "latitude": 34.058000,
  "longitude": 74.800000,
  "trip_id": "TRIP-20260810-091",
  "description": "Driver refusing to stop at designated stop. Aggressive behavior."
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "sos_id": "sos-20260810-001",
    "status": "dispatched",
    "pcr_reference_number": "PCR-JK-2026-44821",
    "dispatched_at": "2026-08-10T19:52:00Z",
    "confirmation_message": "Your distress signal has been dispatched to J&K Emergency Support Desk (Emergency Helpline (112)). Reference: PCR-JK-2026-44821."
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Latitude must be between -90 and 90, longitude between -180 and 180.",
    "details": [{ "field": "latitude", "issue": "value_out_of_range" }]
  },
  "timestamp": "2026-08-10T19:52:00Z"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "SOS trigger requires a valid authenticated session."
  },
  "timestamp": "2026-08-10T19:52:00Z"
}
```

**Error Response (429 Too Many Requests):**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "SOS triggers are limited to 3 per minute to prevent abuse."
  },
  "timestamp": "2026-08-10T19:52:30Z"
}
```

**Example Call:**

```bash
curl -X POST "https://api.safar.jk.gov.in/api/v1/sos/trigger" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"latitude":34.058,"longitude":74.800,"trip_id":"TRIP-20260810-091","description":"Driver refusing to stop."}'
```

---

#### 8. `GET /api/v1/compliance/audit-report`

Generates a paginated regulatory Transit Regulatory Council audit report with compliance status, severity, operator details, and discrepancy amounts.

- **Authentication:** `Bearer <access_token>` required. Role: `AUDITOR`, `ADMIN`, or `SUPER_ADMIN`.
- **Rate Limit:** 30 requests/minute per user.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `page` | integer | No | `1` | Page number |
| `limit` | integer | No | `50` | Items per page (max `100`) |
| `sort_by` | string | No | `created_at` | `created_at`, `discrepancy_amount_paise`, `severity`, `compliance_status` |
| `order` | string | No | `desc` | `asc` or `desc` |
| `region` | string | No | — | Filter: `Kashmir` or `Jammu` |
| `status` | string | No | — | `compliant`, `under_investigation`, `violated` |
| `severity` | string | No | — | `none`, `rounding_variance`, `minor_overcharge`, `major_overcharge` |
| `operator_id` | UUID | No | — | Filter by operator UUID |
| `date_from` | ISO 8601 | No | — | Start of reporting period (inclusive) |
| `date_to` | ISO 8601 | No | — | End of reporting period (inclusive) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "payment_id": "pay-uuid-001",
      "trip_id": "TRIP-20260810-091",
      "receipt_code": "RCP-X9Y8Z7",
      "route_name": "Srinagar - Budgam",
      "region": "Kashmir",
      "operator_name": "Kashmir Valley Transporters",
      "vehicle_registration": "JK01-AV-9912",
      "payment_method": "cash",
      "calculated_fare_rupees": 14.00,
      "actual_paid_rupees": 20.00,
      "discrepancy_rupees": 6.00,
      "severity": "major_overcharge",
      "compliance_status": "violated",
      "created_at": "2026-08-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1, "limit": 50, "total_items": 342, "total_pages": 7, "has_next": true, "has_previous": false
  },
  "summary": {
    "total_trips_audited": 342,
    "compliant_trips": 298,
    "violated_trips": 31,
    "under_investigation": 13,
    "total_overcharge_rupees": 1842.00,
    "compliance_rate_percent": 87.13
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Your role (COMMUTER) does not have access to audit reports. Required: AUDITOR, ADMIN, or SUPER_ADMIN."
  },
  "timestamp": "2026-08-10T19:55:00Z"
}
```

**Example Call:**

```bash
curl -X GET "https://api.safar.jk.gov.in/api/v1/compliance/audit-report?region=Kashmir&status=violated&severity=major_overcharge&date_from=2026-08-01T00:00:00Z&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Accept: application/json"
```

---

#### 9. `GET /api/v1/compliance/violations/csv`

Downloads operator violations as a CSV spreadsheet for regulatory submission.

- **Authentication:** `Bearer <access_token>` required. Role: `AUDITOR`, `ADMIN`, or `SUPER_ADMIN`.
- **Rate Limit:** 10 requests/minute per user.
- **Response Content-Type:** `text/csv; charset=utf-8`
- **Response Header:** `Content-Disposition: attachment; filename="safar-violations-YYYY-MM-DD.csv"`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `region` | string | No | — | Filter: `Kashmir` or `Jammu` |
| `severity` | string | No | — | `minor_overcharge`, `major_overcharge` |
| `operator_id` | UUID | No | — | Filter by operator UUID |
| `date_from` | ISO 8601 | No | 30 days ago | Start of date range |
| `date_to` | ISO 8601 | No | now | End of date range |

**CSV Output Columns:**

```
payment_id,trip_id,receipt_code,route,region,operator,vehicle_reg,calculated_fare_inr,actual_paid_inr,overcharge_inr,severity,status,timestamp
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "CSV export requires AUDITOR, ADMIN, or SUPER_ADMIN role."
  },
  "timestamp": "2026-08-10T19:56:00Z"
}
```

**Example Call:**

```bash
curl -X GET "https://api.safar.jk.gov.in/api/v1/compliance/violations/csv?region=Kashmir&severity=major_overcharge" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -o "violations-export.csv"
```

---

#### 10. `POST /api/v1/auth/login`

Authenticates a user and returns a JWT access token plus sets a HttpOnly refresh cookie.

- **Authentication:** None (login endpoint).
- **Rate Limit:** 10 requests/minute per IP. Lockout after 5 consecutive failures (30-second cooldown).

**Request Body:**

```json
{
  "phone_number": "+919906000001",
  "password_hash": "sha256:100000:salt:derived_key_hex"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "full_name": "Admin Farhaan",
      "role": "ADMIN"
    }
  }
}
```

Also sets: `Set-Cookie: refresh_token=opaque-token; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`

**Error Response (401 — Invalid Credentials):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Phone number or password is incorrect.",
    "remaining_attempts": 3
  },
  "timestamp": "2026-08-10T19:58:00Z"
}
```

**Error Response (429 — Lockout):**

```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Too many failed login attempts. Account locked for 30 seconds.",
    "locked_until": "2026-08-10T19:58:30Z"
  },
  "timestamp": "2026-08-10T19:58:00Z"
}
```

---

#### 11. `POST /api/v1/auth/refresh`

Exchanges a valid refresh token cookie for a new access token and rotated refresh token.

- **Authentication:** Refresh token via HttpOnly cookie (not Bearer header).

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...(new)...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Error Response (401 — Replay Attack Detected):**

```json
{
  "success": false,
  "error": {
    "code": "SESSION_COMPROMISED",
    "message": "A previously revoked refresh token was reused. All sessions for this account have been invalidated. Please log in again."
  },
  "timestamp": "2026-08-10T20:00:00Z"
}
```

---

#### 12. `POST /api/v1/auth/logout`

Revokes the current session's refresh token and clears the HttpOnly cookie.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": { "message": "Session terminated successfully." }
}
```

---

## 9. Data Models & Database Schema (PostgreSQL + PostGIS DDL)

### Enum Types

```sql
CREATE TYPE user_role_enum       AS ENUM ('COMMUTER','DRIVER','AUDITOR','ADMIN','SUPER_ADMIN');
CREATE TYPE payment_method_enum  AS ENUM ('CASH','UPI','CARD','WALLET','PASS');
CREATE TYPE payment_status_enum  AS ENUM ('PENDING_PAYMENT','CASH_EXPECTED','COMPLETED','DISPUTED','CANCELLED');
CREATE TYPE compliance_status_enum AS ENUM ('COMPLIANT','UNDER_INVESTIGATION','VIOLATED');
CREATE TYPE severity_enum        AS ENUM ('NONE','ROUNDING_VARIANCE','MINOR_OVERCHARGE','MAJOR_OVERCHARGE');
CREATE TYPE dispute_status_enum  AS ENUM ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED');
CREATE TYPE sos_status_enum      AS ENUM ('OPEN','DISPATCHED','RESOLVED','FALSE_ALARM');
```

### Table: `tenants`

Multi-tenant regional state isolation.

```sql
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(32) UNIQUE NOT NULL,
    tenant_name VARCHAR(128) NOT NULL,
    state_name VARCHAR(64) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(16) UNIQUE NOT NULL,
    full_name VARCHAR(128),
    role user_role_enum NOT NULL DEFAULT 'COMMUTER',
    password_hash VARCHAR(256),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `sessions`

Tracks refresh tokens and device metadata for token rotation and multi-device logout.

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(256) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(refresh_token_hash) WHERE revoked = FALSE;
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked = FALSE;
```

**Design:** `refresh_token_hash` stores SHA-256 of the opaque token. On rotation, old row is marked `revoked = TRUE`. Replayed revoked tokens trigger invalidation of all user sessions. A cron purges expired sessions every 6 hours.

### Table: `fare_versions` & `fare_slabs`

```sql
CREATE TABLE IF NOT EXISTS fare_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    version_number INT NOT NULL UNIQUE,
    version_tag VARCHAR(32) NOT NULL,
    published_by UUID REFERENCES users(id),
    effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_single_active_fare_version ON fare_versions(tenant_id) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS fare_slabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fare_version_id UUID REFERENCES fare_versions(id) ON DELETE CASCADE,
    region VARCHAR(32) NOT NULL,
    terrain VARCHAR(32) NOT NULL,
    min_distance_km NUMERIC(5,2) NOT NULL,
    max_distance_km NUMERIC(5,2) NOT NULL,
    flat_rate NUMERIC(6,2),
    per_km_rate NUMERIC(6,2),
    CONSTRAINT check_distance_range CHECK (max_distance_km > min_distance_km)
);

CREATE INDEX idx_fare_slabs_lookup ON fare_slabs(fare_version_id, region, terrain);
```

### Table: `operators` & `vehicles`

```sql
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    operator_name VARCHAR(128) NOT NULL,
    permit_registration VARCHAR(32) UNIQUE NOT NULL,
    phone_number VARCHAR(16) UNIQUE,
    association_name VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    registration_number VARCHAR(32) UNIQUE NOT NULL,
    vehicle_type VARCHAR(32) NOT NULL,
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    capacity INT NOT NULL DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `routes` & `route_stops` (PostGIS)

```sql
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_code VARCHAR(32) UNIQUE NOT NULL,
    origin_name VARCHAR(128) NOT NULL,
    destination_name VARCHAR(128) NOT NULL,
    region VARCHAR(32) NOT NULL,
    terrain VARCHAR(32) NOT NULL,
    total_distance_km NUMERIC(6,2) NOT NULL,
    path GEOMETRY(LineString, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(128) NOT NULL,
    stop_sequence INT NOT NULL,
    cumulative_distance_km NUMERIC(6,2) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_route_stop_seq UNIQUE (route_id, stop_sequence)
);

CREATE INDEX idx_route_stops_geom ON route_stops USING GIST(location);
CREATE INDEX idx_routes_path ON routes USING GIST(path);
```

### Table: `payments`

Core hybrid payment audit log.

```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    calculated_fare_paise INT NOT NULL,
    actual_paid_paise INT DEFAULT NULL,
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    receipt_code VARCHAR(32) UNIQUE NOT NULL,
    discrepancy_amount_paise INT DEFAULT 0,
    discrepancy_flag BOOLEAN DEFAULT FALSE,
    severity severity_enum DEFAULT 'NONE',
    compliance_status compliance_status_enum DEFAULT 'COMPLIANT',
    conductor_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_receipt_code ON payments(receipt_code);
CREATE INDEX idx_payments_compliance ON payments(compliance_status, severity);
```

### Table: `operator_compliance_scores`

Aggregated per-operator compliance metrics for the Transit Regulatory Council leaderboard.

```sql
CREATE TABLE IF NOT EXISTS operator_compliance_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    total_trips_audited INT DEFAULT 0,
    compliant_trips INT DEFAULT 0,
    overcharge_trips INT DEFAULT 0,
    compliance_score NUMERIC(5,2) DEFAULT 100.00,
    total_overcharge_paise INT DEFAULT 0,
    inspection_flagged BOOLEAN DEFAULT FALSE,
    inspection_notes TEXT,
    last_inspection_date TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operator_compliance ON operator_compliance_scores(operator_id);
CREATE INDEX idx_operator_flagged ON operator_compliance_scores(inspection_flagged) WHERE inspection_flagged = TRUE;
```

**Design:** `compliance_score = (compliant_trips / total_trips_audited) * 100`. Operators with `compliance_score < 70.0` are auto-flagged. `inspection_notes` stores admin-authored justification.

### Table: `disputes`

User-submitted overcharge complaints with resolution tracking.

```sql
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    discrepancy_paise INT NOT NULL,
    dispute_reason VARCHAR(256) NOT NULL,
    status dispute_status_enum DEFAULT 'OPEN',
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolution_action VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_operator ON disputes(operator_id);
```

**Design:** `resolution_action` values: `refund_issued`, `operator_warned`, `operator_suspended`, `dismissed`. Transitions: `OPEN -> UNDER_REVIEW -> RESOLVED | REJECTED`.

### Table: `sos_alerts`

Emergency distress events with PostGIS location.

```sql
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    location GEOMETRY(Point, 4326),
    description TEXT,
    status sos_status_enum DEFAULT 'OPEN',
    pcr_reference_number VARCHAR(64),
    dispatched_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_sos_alerts_geom ON sos_alerts USING GIST(location);
```

**Design:** SOS events are never hard-deleted. Transitions: `OPEN -> DISPATCHED -> RESOLVED | FALSE_ALARM`. `pcr_reference_number` is assigned by the Emergency Helpline (112) API.

### Table: `admin_audit_log`

Append-only log of all administrative actions. Rows are never updated or deleted.

```sql
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at);
```

**Design:** `action` uses controlled vocabulary: `FARE_SLAB_PUBLISH`, `FARE_SLAB_ROLLBACK`, `USER_LOCK`, `USER_UNLOCK`, `OPERATOR_FLAG`, `DISPUTE_RESOLVE`, `SESSION_REVOKE`, `PASSWORD_CHANGE`. `old_value`/`new_value` store JSONB snapshots for full audit trail.

---

## 10. Offline Behavior & Caching Strategy

### 10.1 Service Worker Architecture

- **Registration:** Inline Blob URL Service Worker.
- **Cache Strategies:** Cache-First (static assets), Stale-While-Revalidate (fonts), Network-First (APIs, navigation).
- **Cache Name:** `safar-v250` (versioned, rotated on deployment).
- **Offline Shell:** Synthetic HTML fallback for navigation requests when offline.

### 10.2 Local Storage Persistence

| Key | Storage | Content | TTL |
| :--- | :--- | :--- | :--- |
| `safar_fare_slabs` | localStorage | Active fare slab JSON (all regions/terrains) | Until new version synced |
| `safar_fare_version` | localStorage | Active version tag (e.g. `V20260809`) | Until new version synced |
| `safar_custom_routes` | localStorage | Master route list with stop sequences | Until routes update |
| `safar_offline_bookings` | IndexedDB (`safar_sync`) | Offline bookings pending sync | Until synced |
| `safar_user_prefs` | localStorage | Language, theme, last route, concession | Persistent |

### 10.3 Fare Version Sync Protocol

Three-layer detection when an admin publishes new fare slabs:

**Layer 1 — Polling (Primary):** Client calls `GET /api/v1/fare/version-check?current_version=V20260809` every 15 minutes (with +/-30s jitter). Uses `If-None-Match` / `ETag` to skip unchanged data. If update detected, downloads new slabs, verifies SHA-256 checksum, and atomically swaps localStorage.

**Layer 2 — Push Notification (Secondary):** Server sends push payload `{ type: "FARE_UPDATE", version: "V20260901" }`. Service Worker fetches slabs in background, updates localStorage, posts `FARE_VERSION_UPDATED` message to all windows.

**Layer 3 — Server-Sent Events (Admin Dashboard Only):** The admin dashboard subscribes to `GET /api/v1/events/stream` for real-time `fare_version_published` events.

### 10.4 Atomic Update & Rollback

1. **Download:** Fetch complete slab JSON for new version.
2. **Validate:** Verify SHA-256 checksum matches server value.
3. **Stage:** Write to `safar_fare_slabs_staging` in localStorage.
4. **Swap:** Atomically rename staging to production key.
5. **Rollback on Failure:** Retain previous slabs, log failure, retry with exponential backoff (1m, 5m, 15m, 60m). Display non-blocking banner: "Using fare data from [date]. Update pending."

### 10.5 Offline Booking Conflict Resolution

1. **Local Receipt:** Code with `RCP-OFFLINE-` prefix generated locally.
2. **IndexedDB Queue:** Booking stored with `status: 'pending_sync'` and `idempotency_key` (UUID v4).
3. **Background Sync:** On connectivity, Service Worker POSTs each booking. Server returns canonical receipt code. Local record updated to `status: 'synced'`.
4. **Fare Version Mismatch:** If booking was created with an older fare version, server recalculates using the version active at `booking.created_at`. Response includes `fare_recalculated: true` flag.
5. **Duplicate Prevention:** Server rejects duplicates via `idempotency_key` with `409 Conflict`.

---

## 11. Admin Dashboard & Regulatory Audit System

The Safar Admin Suite (`admin.html`) acts as the regulatory control room for J&K Transit Regulatory Council.

### 11.1 Dashboard Overview Screen

Summary statistics cards and live fleet map.

| Card | Data Source | Color |
| :--- | :--- | :--- |
| **Active Fleet** | `trips` WHERE `status = 'ACTIVE'` | `#60a5fa` |
| **Today's Revenue** | SUM `payments.calculated_fare_paise` today | `#a7f3d0` |
| **Open SOS Alerts** | `sos_alerts` WHERE `status IN ('OPEN','DISPATCHED')` | `#f87171` |
| **Compliance Rate** | AVG `operator_compliance_scores.compliance_score` | `#14b8a6` |

Live fleet map: Leaflet.js with WebSocket GPS pings, bus markers with popup (vehicle number, route, occupancy).

### 11.2 Fare Slab Management

| Action | Endpoint | Confirmation |
| :--- | :--- | :---: |
| Edit slabs inline | — | No |
| Publish new version | `PUT /api/v1/admin/fare-slabs` | Yes |
| Rollback to previous | `PUT /api/v1/admin/fare-slabs` (previous data) | Yes |
| View version history | `GET /api/v1/admin/fare-versions` | No |

Version history columns: Version Tag, Published By, Published At, Status, Actions (View Slabs / Rollback).

All publish/rollback actions logged in `admin_audit_log` with `action = 'FARE_SLAB_PUBLISH'` or `'FARE_SLAB_ROLLBACK'`.

### 11.3 Compliance Audit Leaderboard

Operator leaderboard table columns: Rank, Operator Name, Transit Permit Registration, Total Trips, Compliant Trips, Overcharge Trips, Compliance Score (%), Total Overcharge, Inspection Flag, Last Inspection.

Actions: Flag for Inspection, Unflag, Adjust Score (Super Admin only), View Trip History.

### 11.4 Dispute Management

Dispute queue columns: Dispute ID, Receipt Code, Route, Commuter, Operator, Regulated Fare, Actual Paid, Overcharge, Severity (color badge), Status, Created At.

Resolution actions:

| Action | Transition | Audit Log |
| :--- | :--- | :--- |
| Assign to Self | `OPEN -> UNDER_REVIEW` | `DISPUTE_ASSIGN` |
| Resolve (Refund) | `UNDER_REVIEW -> RESOLVED` | `DISPUTE_RESOLVE` |
| Resolve (Warn Operator) | `UNDER_REVIEW -> RESOLVED` | `DISPUTE_RESOLVE` |
| Resolve (Suspend Operator) | `UNDER_REVIEW -> RESOLVED` | `DISPUTE_RESOLVE` |
| Reject | `UNDER_REVIEW -> REJECTED` | `DISPUTE_REJECT` |

### 11.5 User Account Management

Columns: Full Name, Phone, Role (badge), Status (Active/Locked), Last Login, Created At.

Actions: Lock Account (`USER_LOCK`), Unlock (`USER_UNLOCK`), Force Logout (`SESSION_REVOKE`), Change Role (`ROLE_CHANGE`).

### 11.6 SOS Alert Management

Columns: SOS ID, User, GPS Coordinates (map link), Trip, Description, PCR Reference, Status, Triggered At.

Actions: Mark Dispatched (`OPEN -> DISPATCHED`), Mark Resolved (`DISPATCHED -> RESOLVED`), Mark False Alarm (`OPEN/DISPATCHED -> FALSE_ALARM`).

### 11.7 Data Exports

| Export | Format | Endpoint |
| :--- | :--- | :--- |
| Regulatory Audit Report | JSON | `GET /api/v1/compliance/audit-report` |
| Operator Violations | CSV | `GET /api/v1/compliance/violations/csv` |
| Admin Audit Trail | JSON | `GET /api/v1/admin/audit-log` |
| SOS Event Log | CSV | `GET /api/v1/admin/sos-events/csv` |

### 11.8 Admin Password Security

- PBKDF2 SHA-256, 100,000 iterations, 16-byte random salt.
- Password inputs zeroed immediately after hashing.
- Change requires current password verification.
- Every password change logged in `admin_audit_log` with `action = 'PASSWORD_CHANGE'`.

---

## 12. Non-Functional Requirements (NFRs)

| Category | Requirement | Target |
| :--- | :--- | :--- |
| **Performance** | API p95 response time | < `200ms` |
| **Performance** | Client-side fare calculation | < `50ms` |
| **Performance** | GPS broadcast latency | < `3 seconds` |
| **Availability** | API gateway uptime | 99.9% |
| **Availability** | Offline fare engine resilience | Up to `48 hours` |
| **Security** | Transport encryption | TLS 1.3 |
| **Security** | Data at rest encryption | AES-256 |
| **Security** | Content Security Policy | Strict nonce-based; zero `unsafe-inline` |
| **Security** | Token architecture | RS256 JWT (15m) + HttpOnly refresh (7d) |
| **Accessibility** | WCAG compliance level | 2.1 Level AA |
| **Accessibility** | Touch targets | >= 44x44 px (56x56 in Senior Mode) |
| **Internationalization** | Languages | English, Kashmiri, Hindi |
| **Scalability** | Concurrent users | 10,000+ |
| **Data Retention** | Payment audit logs | 7 years |
| **Data Retention** | Admin audit logs | 5 years |
| **Data Retention** | SOS events | Permanent |

---

## 13. Testing & Acceptance Criteria

### Test Scenario 1: Standard Fare Calculation
- **Given:** Distance = `14.0 km`, Region = `Kashmir`, Terrain = `plain`, Vehicle = `matador`.
- **When:** Fare calculation is executed.
- **Then:** Result must display exactly `Rs 14` (Up to 15km slab).

### Test Scenario 2: Overcharge Discrepancy Trigger
- **Given:** Calculated fare = `Rs 14`, Actual paid = `Rs 20`.
- **When:** Post-trip audit is submitted.
- **Then:** Flags `major_overcharge` (Rs 6) and displays Emergency Helpline (112) escalation modal.

### Test Scenario 3: Conductor Receipt Verification (Pre-Paid)
- **Given:** Booking `RCP-X9Y8Z7` paid via UPI.
- **When:** Conductor calls `GET /api/v1/conductor/verify/RCP-X9Y8Z7`.
- **Then:** `valid: true`, `payment_status: "completed"`, instruction says no cash required.

### Test Scenario 4: Offline Booking Sync
- **Given:** Offline booking with code `RCP-OFFLINE-A1B2C3`.
- **When:** Network returns, background sync fires.
- **Then:** Booking synced, canonical receipt code returned, IndexedDB updated.

### Test Scenario 5: Fare Version Sync
- **Given:** Client has cached `V20260809`.
- **When:** Admin publishes `V20260901`, client polls version check.
- **Then:** Client detects update, downloads slabs, verifies checksum, swaps cache atomically.

### Test Scenario 6: Token Rotation Security
- **Given:** User logs in, receives refresh token `RT-1`.
- **When:** Token refreshed to `RT-2`. Attacker replays `RT-1`.
- **Then:** Server detects revoked token, invalidates all user sessions, returns `401 SESSION_COMPROMISED`.

### Test Scenario 7: SOS Dispatch
- **Given:** Commuter at coordinates `(34.058, 74.800)` on trip.
- **When:** `POST /api/v1/sos/trigger` called.
- **Then:** Returns `201` with `pcr_reference_number`, SOS alert status = `DISPATCHED`.

### Test Scenario 8: Admin Fare Slab Publish
- **Given:** Admin submits new slabs with version `V20260901-Transit Regulatory Council`.
- **When:** Request processed.
- **Then:** Previous version deactivated, new version active, action in `admin_audit_log`.

---

## 14. Deployment, DevOps & Monitoring

### Environments

| Environment | URL | Purpose |
| :--- | :--- | :--- |
| Development | `http://localhost:3000` | Local development |
| Staging | `https://staging.safar.jk.gov.in` | Pre-production testing |
| Production | `https://safar.jk.gov.in` | Live public deployment |

### CI/CD Pipeline

1. **Lint:** ESLint (JS), Stylelint (CSS), W3C HTML validation.
2. **Test:** Jest unit tests, Playwright E2E tests.
3. **Build:** Docker multi-stage builds (Node.js 20 LTS).
4. **Deploy:** GitHub Actions to Docker Registry to Kubernetes.
5. **Post-Deploy:** Automated smoke tests (health, fare calc, auth flow).

### Monitoring & Alerting

| Metric | Tool | Alert Threshold |
| :--- | :--- | :--- |
| API p95 latency | Prometheus + Grafana | > 200ms for 5 min |
| Error rate (5xx) | Prometheus | > 1% for 2 min |
| Active live buses | Grafana | < 1 during business hours |
| SOS alert open count | PagerDuty | > 0 (immediate) |
| DB connection pool | pg_stat_activity | > 80% utilization |
| Redis memory | Redis INFO | > 80% maxmemory |
| Certificate expiry | Certbot + cron | 14 days before |

---

## 15. Appendices

### Appendix A: Glossary

| Term | Definition |
| :--- | :--- |
| **Transit Regulatory Council** | State Regional Transport Authority (Jammu & Kashmir) |
| **Emergency Helpline (112)** | Emergency Support Desk Emergency Escalation Dispatch Hotline |
| **Maxicab** | Tavera / Tata Sumo shared passenger vehicle (7-10 seats) |
| **PBKDF2** | Password-Based Key Derivation Function 2 |
| **RBAC** | Role-Based Access Control |
| **SSE** | Server-Sent Events |
| **PostGIS** | PostgreSQL extension for spatial data |
| **Haversine** | Formula for great-circle distance between GPS points |

### Appendix B: Master Fare Calculation Formula

`Final Fare = Round(BaseSlab(region, terrain, d) * VehicleMultiplier * (1 - ConcessionPct))`

### Appendix C: Admin Audit Log Action Vocabulary

| Action Code | Description | Entity Type |
| :--- | :--- | :--- |
| `FARE_SLAB_PUBLISH` | New fare version published | `fare_versions` |
| `FARE_SLAB_ROLLBACK` | Fare version rolled back | `fare_versions` |
| `USER_LOCK` | User account deactivated | `users` |
| `USER_UNLOCK` | User account reactivated | `users` |
| `ROLE_CHANGE` | User role modified | `users` |
| `SESSION_REVOKE` | All sessions invalidated | `sessions` |
| `PASSWORD_CHANGE` | Admin changed password | `users` |
| `OPERATOR_FLAG` | Operator flagged for inspection | `operators` |
| `OPERATOR_UNFLAG` | Inspection flag cleared | `operators` |
| `DISPUTE_ASSIGN` | Dispute assigned for review | `disputes` |
| `DISPUTE_RESOLVE` | Dispute resolved | `disputes` |
| `DISPUTE_REJECT` | Dispute rejected | `disputes` |
| `SOS_DISPATCH` | SOS dispatched to Emergency Helpline (112) | `sos_alerts` |
| `SOS_RESOLVE` | SOS marked resolved | `sos_alerts` |
| `SOS_FALSE_ALARM` | SOS marked false alarm | `sos_alerts` |

### Appendix D: Vehicle Type Multipliers

| Vehicle Type | Code | Multiplier | Capacity |
| :--- | :--- | :---: | :--- |
| Matador / Local Mini-Bus | `matador` | 1.00x | 25-35 seats |
| Mini-Bus | `minibus` | 1.00x | 20-30 seats |
| Tata Magic / Eco | `tatamagic` | 1.10x | 10-14 seats |
| Shared Van / E-Rickshaw | `sharedvan` | 1.15x | 6-8 seats |
| Chalo City E-Bus (AC) | `ebus` | 1.15x | 30-40 seats |
| Tavera / Tata Sumo Maxicab | `tavera` | 1.25x | 7-10 seats |

---

*End of SAFAR Technical Specification (V3.0.0)*
