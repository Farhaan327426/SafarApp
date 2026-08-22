# Safar Backend Production API Specification & Architecture Standard (v2.0)

## 1. Executive Summary & Security Foundations

The Safar Transport Administration Platform API provides hardened, production-grade endpoints for passenger fare engine calculations, route GIS sequence verification, fare slab publication, and compliance auditing.

### Security Architecture & Protocol Enforcement
1. **Dynamic CSRF Protection**: Every session receives a cryptographically secure 256-bit CSRF token generated via `crypto.randomBytes(32)`. Clients fetch this token via `GET /api/v1/auth/csrf-token` and attach it in the `X-CSRF-Token` HTTP header for all state-changing operations (`POST`, `PUT`, `PATCH`, `DELETE`).
2. **HMAC-SHA256 Request Signing**: Sensitive endpoints (`/publish`, `/verify`, `/change-password`) require HMAC-SHA256 signature verification.
   - **Header Requirements**:
     * `X-Signature`: Hex-encoded HMAC-SHA256 signature of `${method}:${path}:${timestamp}:${bodyJsonString}` computed with the server secret key.
     * `X-Timestamp`: Unix timestamp in milliseconds (verified for ±5 minutes freshness).
3. **Per-Endpoint Session Rate Limiting**: All authenticated endpoints enforce a rate limit of **10 requests/minute per endpoint per session**. Requests exceeding this threshold receive HTTP `429 Too Many Requests` with error code `ERR_RATE_LIMIT_EXCEEDED`.
4. **Content Security Policy (CSP)**: Dynamic CSP nonces (`script-src 'nonce-<dynamic>' 'self' ...`) generated per response by server middleware to eliminate inline script vulnerability vectors.
5. **Input Sanitization**: All incoming text payloads (e.g. `stop_name`) are sanitized via DOMPurify on the client and strictly validated against regex `/^[a-zA-Z0-9\s\-\.,()]+$/` on the server.

---

## 2. Data Integrity & Optimistic Concurrency Control (OCC)

### Versioning Architecture
- DB Models (`Route`, `FareVersion`, `FareRule`) include integer `version` tracking fields (default `1`).
- Mutation endpoints (`PUT`, `DELETE`, `/stops`, `/publish`, `/reorder-stops`) accept `version` in body or query parameters.
- If `clientVersion !== serverVersion`, the server aborts the transaction and returns **HTTP 409 Conflict**:
```json
{
  "success": false,
  "error": {
    "code": "ERR_CONCURRENCY_CONFLICT",
    "message": "Concurrency Conflict [ERR_CONCURRENCY_CONFLICT]: The route was updated by another user.",
    "serverVersion": 2,
    "clientVersion": 1,
    "currentData": { ... }
  }
}
```

### Transactional Bulk Operations & Downstream Calculations
1. **CSV Import Atomicity**: Bulk row imports run inside a single database transaction (`prisma.$transaction`). If ANY row fails J&K coordinate bounds validation, `stop_name` regex, or sequence continuity, the entire batch is rolled back (**0 rows committed**).
2. **Stop Deletion Recalculation**: Deleting a stop automatically re-numbers remaining `stop_sequence` values to be strictly contiguous ($1..N$) and recalculates downstream cumulative distances using Haversine geographic leg formulas.
3. **Route Verification Locking**: Route verification acquires an exclusive row lock (`SELECT FOR UPDATE`) within a transaction to prevent concurrent stop modifications during verification.

---

## 3. Geographic & Domain Validation Rules

- **Jammu & Kashmir Coordinate Bounds**:
  * Latitude: `32.0° N` to `37.0° N`
  * Longitude: `73.0° E` to `79.0° E`
- **Stop Name Character Set**: Regex `/^[a-zA-Z0-9\s\-\.,()]+$/`
- **Stop Sequence**: Strictly contiguous positive integers ($1, 2, 3 \dots N$). No gaps or duplicates permitted.
- **Monotonic Cumulative Distance**: Cumulative distances along a route sequence must be strictly monotonically increasing ($KM_i > KM_{i-1}$).
- **Fare Slab Bands**: Minimum fare slab distance bands must be monotonically increasing ($0\text{--}3\text{ km} < 3\text{--}5\text{ km} < 5\text{--}10\text{ km} < 10\text{--}15\text{ km} < 15\text{--}20\text{ km}$).

---

## 4. API Endpoints Directory

### Public Endpoints

#### `GET /health`
- **Description**: System and PostgreSQL database connectivity check.
- **Response**: `{ "status": "ONLINE", "database": "CONNECTED", "timestamp": "2026-08-12T13:30:00Z" }`

#### `GET /api/v1/auth/csrf-token`
- **Description**: Fetches dynamic CSRF token for the current session.
- **Response Header**: `X-CSRF-Token`
- **Response**: `{ "success": true, "data": { "csrfToken": "a1b2c3..." } }`

#### `POST /api/v1/auth/login`
- **Rate Limit**: 5 attempts / 15 minutes.
- **Body**: `{ "username": "admin", "password": "..." }`
- **Response**: `{ "success": true, "data": { "user": { ... }, "csrfToken": "..." } }`

#### `GET /api/v1/config/service-area`
- **Description**: Returns official J&K service area bounds and expansion rules.
- **Response**:
```json
{
  "success": true,
  "data": {
    "region": "Jammu & Kashmir",
    "bounds": { "minLat": 32.0, "maxLat": 37.0, "minLng": 73.0, "maxLng": 79.0 },
    "stopNameRegex": "^[a-zA-Z0-9\\s\\-\\.,()]+$"
  }
}
```

---

### Authenticated & Role-Gated Endpoints

#### `POST /api/v1/auth/change-password`
- **Roles**: All Authenticated Users
- **Security**: Requires HMAC Signature (`X-Signature`, `X-Timestamp`) + CSRF token.
- **Body**: `{ "currentPassword": "...", "newPassword": "..." }`

#### `POST /api/v1/admin/fares/publish`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **Security**: Requires HMAC Signature + OCC Version Check.
- **Body**: `{ "slabs": { "3": 9, "5": 14, ... }, "rates": { ... }, "version": 1 }`
- **Errors**: `409 Conflict` (version mismatch), `401 Unauthorized` (invalid signature).

#### `GET /api/v1/admin/routes/completeness-report`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`, `AUDITOR`
- **Response**: Metrics on complete, review, and incomplete routes across J&K.

#### `POST /api/v1/admin/routes/import-csv`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **Body**: `{ "importId": "import-123", "rows": [ { "route_code": "SRN-BDG", "stop_sequence": 1, "stop_name": "Lal Chowk", "latitude": 34.0722, "longitude": 74.8058 } ] }`
- **Behavior**: All-or-nothing transaction. Rollback on ANY row validation failure.

#### `GET /api/v1/admin/routes/import-csv-status?importId=xyz`
- **Description**: Polls status of transactional CSV import job.
- **Response**: `{ "success": true, "data": { "status": "SUCCESS", "importedCount": 45 } }`

#### `POST /api/v1/admin/routes/:routeId/stops`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **Validation**: Zod schema check for J&K bounds, stop_name regex, sequence positive int.
- **Body**: `{ "stopName": "Hyderpora", "latitude": 34.0321, "longitude": 74.7892, "stopSequence": 2, "cumulativeDistanceKm": 4.2, "version": 1 }`

#### `PUT /api/v1/admin/routes/:routeId/stops/:stopId`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **OCC**: Returns `409 Conflict` if route `version` has changed.

#### `DELETE /api/v1/admin/routes/:routeId/stops/:stopId`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **Behavior**: Deletes stop, recalculates downstream KM and sequence $1..N$, increments route version. Returns updated sequence array.

#### `POST /api/v1/admin/routes/:routeId/verify`
- **Roles**: `FARE_ADMIN`, `SUPER_ADMIN`
- **Security**: Requires HMAC Signature + Route Lock (`SELECT FOR UPDATE`).

#### `GET /api/v1/admin/activity-timeline?page=1&limit=20`
- **Parameters**: `page` (default 1), `limit` (default 20, max 50).
- **Response**: Paginated audit log records with actor metadata.

---

## 5. Error Code Registry

| Error Code | HTTP Status | Description & User Remediation |
| :--- | :---: | :--- |
| `ERR_VALIDATION_FAILED` | `400` | Generic payload schema validation failure. Check input types. |
| `ERR_STOP_BOUNDS` | `400` | Coordinates outside J&K bounds (Lat: 32°–37°, Lng: 73°–79°). Enter valid J&K locations. |
| `ERR_STOP_NAME_INVALID` | `400` | Stop name contains illegal characters. Only alphanumeric, spaces, `-`, `.`, `,`, `()` allowed. |
| `ERR_STOP_DUPLICATE_SEQ` | `400` | Sequence gap or duplicate. Ensure sequences are contiguous 1..N. |
| `ERR_NON_MONOTONIC_KM` | `400` | Cumulative distance decreases along route sequence. Re-order stops by distance. |
| `ERR_CONCURRENCY_CONFLICT` | `409` | OCC version mismatch. Fetch fresh server data or merge changes. |
| `ERR_SIGNATURE_MISSING` | `401` | Missing `X-Signature` or `X-Timestamp` header on sensitive endpoint. |
| `ERR_SIGNATURE_INVALID` | `401` | HMAC-SHA256 signature verification failed. Verify server secret key. |
| `ERR_SIGNATURE_EXPIRED` | `401` | Request signature timestamp older than 5 minutes. Sync system clock. |
| `ERR_RATE_LIMIT_EXCEEDED` | `429` | Exceeded 10 requests/min per endpoint. Wait 60 seconds before retrying. |
| `ERR_PASSWORD_WEAK` | `400` | New password is under 8 characters long. |
