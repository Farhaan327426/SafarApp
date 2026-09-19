/**
 * Safar AI - Backend HTTP Server & API Foundation (Stage 1)
 * Built with native Node.js HTTP module for simplicity, reliability, and zero extra dependencies.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSession } from './ai/conversationService.js';
import { calculateFare } from './fare/fareService.js';
import { getRoute } from './routes/routeService.js';
import { getSchedule } from './schedule/scheduleService.js';
import { draftComplaint } from './complaints/complaintService.js';
import { detectFareIntent, detectRouteIntent, detectScheduleIntent, detectComplaintIntent, isLiveTrackingQuery } from './ai/intentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'database');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// MIME types for static frontend serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

// Database store
export const database = {
  locations: [],
  fares: [],
  routes: [],
  schedules: [],
  isLoaded: false
};

/**
 * Loads and validates all database collections
 */
export function loadDatabase() {
  try {
    const locationsPath = path.join(DB_DIR, 'locations.json');
    const faresPath = path.join(DB_DIR, 'fares.json');
    const routesPath = path.join(DB_DIR, 'routes.json');
    const schedulesPath = path.join(DB_DIR, 'schedules.json');

    database.locations = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
    database.fares = JSON.parse(fs.readFileSync(faresPath, 'utf-8'));
    database.routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
    database.schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));

    // Verify all records have DEMO source_type in Stage 1
    const allRecords = [
      ...database.locations,
      ...database.fares,
      ...database.routes,
      ...database.schedules
    ];

    const hasDemoFlag = allRecords.every(r => r.source_type === 'DEMO');
    if (!hasDemoFlag) {
      console.warn('[DataSafety Warning] Some database records do not declare source_type: DEMO');
    }

    database.isLoaded = true;
    console.log(`[Database] Loaded: ${database.locations.length} locations, ${database.fares.length} fare pairs, ${database.routes.length} routes, ${database.schedules.length} schedules. (All DEMO data)`);
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to load database files:', error.message);
    return false;
  }
}

/**
 * Helper to parse JSON request body
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

/**
 * Main HTTP request handler
 */
export function createServer() {
  loadDatabase();

  return http.createServer(async (req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTES ---
    if (pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      // GET /api/health
      if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({
          status: 'ok',
          stage: 5,
          message: 'Safar AI MVP Stage 5 Active (Complaint Assistant)',
          dataSafety: {
            mode: 'DEMO',
            notice: 'All transport values are illustrative demo estimates.'
          },
          database: {
            locationsCount: database.locations.length,
            faresCount: database.fares.length,
            routesCount: database.routes.length,
            schedulesCount: database.schedules.length
          }
        }));
      }

      // GET /api/locations
      if (pathname === '/api/locations' && req.method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({
          locations: database.locations,
          source_type: 'DEMO'
        }));
      }

      // POST /api/fare
      if (pathname === '/api/fare' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const result = calculateFare({
          origin: payload.origin,
          destination: payload.destination,
          vehicleType: payload.vehicleType,
          passengerType: payload.passengerType,
          luggageKg: payload.luggageKg,
          locationsList: database.locations,
          faresList: database.fares
        });

        res.writeHead(200);
        return res.end(JSON.stringify(result));
      }

      // POST /api/route (Stage 3)
      if (pathname === '/api/route' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const result = getRoute({
          origin: payload.origin,
          destination: payload.destination,
          transportMode: payload.transportMode,
          locationsList: database.locations,
          routesList: database.routes
        });

        res.writeHead(200);
        return res.end(JSON.stringify(result));
      }

      // POST /api/schedule (Stage 4)
      if (pathname === '/api/schedule' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const result = getSchedule({
          origin: payload.origin,
          destination: payload.destination,
          vehicleType: payload.vehicleType,
          locationsList: database.locations,
          schedulesList: database.schedules
        });

        res.writeHead(200);
        return res.end(JSON.stringify(result));
      }

      // POST /api/complaint (Stage 5)
      if (pathname === '/api/complaint' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const result = draftComplaint({
          date: payload.date,
          location: payload.location,
          route: payload.route,
          vehicleType: payload.vehicleType,
          issue: payload.issue,
          amountCharged: payload.amountCharged,
          expectedFare: payload.expectedFare,
          description: payload.description
        });

        res.writeHead(200);
        return res.end(JSON.stringify(result));
      }

      // POST /api/chat
      if (pathname === '/api/chat' && req.method === 'POST') {
        const payload = await parseRequestBody(req);
        const userMessage = payload.message || '';
        const sessionId = payload.sessionId || 'default';
        const session = getSession(sessionId);

        // Stage 4 Safety Check: Live tracking requests must be rejected safely
        if (isLiveTrackingQuery(userMessage)) {
          res.writeHead(200);
          return res.end(JSON.stringify({
            reply: 'Live tracking is not available in the current version.',
            source_type: 'DEMO',
            disclaimer: 'This is the listed schedule, not live vehicle information.',
            stage: 5,
            context: session.getContext()
          }));
        }

        // Stage 5: Detect COMPLAINT intent
        const complaintDetection = detectComplaintIntent(userMessage, session);

        if (complaintDetection && complaintDetection.intent === 'COMPLAINT') {
          if (complaintDetection.route) {
            const parts = complaintDetection.route.split('→').map(s => s.trim());
            if (parts.length === 2) {
              session.updateContext({
                origin: parts[0],
                destination: parts[1],
                transportMode: complaintDetection.vehicleType,
                intent: 'COMPLAINT'
              });
            }
          } else {
            session.updateContext({
              intent: 'COMPLAINT'
            });
          }

          const complaintResult = draftComplaint({
            route: complaintDetection.route,
            location: complaintDetection.location,
            vehicleType: complaintDetection.vehicleType,
            issue: complaintDetection.issue,
            amountCharged: complaintDetection.amountCharged,
            expectedFare: complaintDetection.expectedFare,
            description: userMessage
          });

          res.writeHead(200);
          return res.end(JSON.stringify({
            reply: 'I have prepared a draft complaint summary for you. This has not been filed with any authority.',
            complaintData: complaintResult,
            source_type: 'DEMO',
            disclaimer: complaintResult.disclaimer,
            type: 'COMPLAINT',
            context: session.getContext()
          }));
        }

        // Stage 4: Detect SCHEDULE intent or follow-up
        const scheduleDetection = detectScheduleIntent(userMessage, session);

        if (scheduleDetection && scheduleDetection.intent === 'SCHEDULE') {
          if (!scheduleDetection.origin || !scheduleDetection.destination) {
            res.writeHead(200);
            return res.end(JSON.stringify({
              reply: 'Which route would you like to check? Please provide the starting point and destination.',
              source_type: 'DEMO',
              disclaimer: 'This is the listed schedule, not live vehicle information.',
              type: 'SCHEDULE_PROMPT',
              context: session.getContext()
            }));
          }

          // Update session memory
          session.updateContext({
            origin: scheduleDetection.origin,
            destination: scheduleDetection.destination,
            transportMode: scheduleDetection.vehicleType,
            intent: 'SCHEDULE'
          });

          const scheduleResult = getSchedule({
            origin: scheduleDetection.origin,
            destination: scheduleDetection.destination,
            vehicleType: scheduleDetection.vehicleType,
            locationsList: database.locations,
            schedulesList: database.schedules
          });

          res.writeHead(200);
          return res.end(JSON.stringify({
            reply: scheduleResult.formattedText || scheduleResult.message,
            scheduleData: scheduleResult.success ? scheduleResult : null,
            source_type: 'DEMO',
            disclaimer: scheduleResult.disclaimer,
            type: 'SCHEDULE',
            context: session.getContext()
          }));
        }

        // Stage 2: Detect FARE intent or follow-up
        const fareDetection = detectFareIntent(userMessage, session);

        if (fareDetection && fareDetection.intent === 'FARE') {
          if (!fareDetection.origin || !fareDetection.destination) {
            res.writeHead(200);
            return res.end(JSON.stringify({
              reply: 'Which route would you like to check? Please provide the starting point and destination.',
              source_type: 'DEMO',
              disclaimer: 'Demo / Estimated data — actual fare may vary by operator.',
              type: 'FARE_PROMPT',
              context: session.getContext()
            }));
          }

          // Update session memory
          session.updateContext({
            origin: fareDetection.origin,
            destination: fareDetection.destination,
            transportMode: fareDetection.vehicleType,
            intent: 'FARE'
          });

          const fareResult = calculateFare({
            origin: fareDetection.origin,
            destination: fareDetection.destination,
            vehicleType: fareDetection.vehicleType,
            locationsList: database.locations,
            faresList: database.fares
          });

          res.writeHead(200);
          return res.end(JSON.stringify({
            reply: fareResult.formattedText || fareResult.message,
            fareData: fareResult.success ? fareResult : null,
            source_type: 'DEMO',
            disclaimer: fareResult.disclaimer,
            type: 'FARE',
            context: session.getContext()
          }));
        }

        // Stage 3: Detect ROUTE intent or follow-up
        const routeDetection = detectRouteIntent(userMessage, session);

        if (routeDetection && routeDetection.intent === 'ROUTE') {
          if (!routeDetection.origin || !routeDetection.destination) {
            res.writeHead(200);
            return res.end(JSON.stringify({
              reply: 'Which route would you like to check? Please provide the starting point and destination.',
              source_type: 'DEMO',
              disclaimer: 'Demo route information — actual route and stops may vary.',
              type: 'ROUTE_PROMPT',
              context: session.getContext()
            }));
          }

          // Update session memory
          session.updateContext({
            origin: routeDetection.origin,
            destination: routeDetection.destination,
            intent: 'ROUTE'
          });

          const routeResult = getRoute({
            origin: routeDetection.origin,
            destination: routeDetection.destination,
            locationsList: database.locations,
            routesList: database.routes
          });

          res.writeHead(200);
          return res.end(JSON.stringify({
            reply: routeResult.formattedText || routeResult.message,
            routeData: routeResult.success ? routeResult : null,
            source_type: 'DEMO',
            disclaimer: routeResult.disclaimer,
            type: 'ROUTE',
            context: session.getContext()
          }));
        }

        // Fallback for non-fare queries in Stage 2 (preserved from Stage 1):
        res.writeHead(200);
        return res.end(JSON.stringify({
          reply: 'Safar AI is ready to help with fares, routes, schedules, and complaints.',
          source_type: 'DEMO',
          notice: 'Demo Mode: All transport data is illustrative and not official.',
          stage: 2,
          receivedMessage: userMessage,
          context: session.getContext()
        }));
      }

      // 404 for unknown API routes
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'API route not found' }));
    }

    // --- STATIC FRONTEND ASSETS ---
    let safePath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(FRONTEND_DIR, safePath);

    // Prevent directory traversal
    if (!filePath.startsWith(FRONTEND_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA routing if available
        const fallback = path.join(FRONTEND_DIR, 'index.html');
        if (fs.existsSync(fallback)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return fs.createReadStream(fallback).pipe(res);
        }
        res.writeHead(404);
        return res.end('Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

// Auto-start server when run directly
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const PORT = process.env.PORT || 3001;
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`   SAFAR AI MVP — STAGE 1 FOUNDATION   `);
    console.log(`   Server running on http://localhost:${PORT}`);
    console.log(`   Data Safety Mode: DEMO (Strictly Enforced)`);
    console.log(`=========================================`);
  });
}
