/**
 * SAFAR PRO — Agentic Tool Execution Layer
 * ===================================================
 * File: frontend/js/safar-tools.js
 * Features:
 * - Strict schema-driven tool registry for the AI Voice Assistant
 * - Safe verified execution with confirmation gates for consequential actions
 * - Tools: findAuthority, getEmergencyNumber, lookupFare, checkHighwayStatus,
 *   generateComplaint, initiateCall, openWhatsApp
 */

const SafarTools = (() => {
  'use strict';

  const tools = {
    // 1. Find verified Transport / Traffic / RTO Authority
    findAuthority: {
      name: 'findAuthority',
      description: 'Find verified J&K transport authorities, RTOs, or traffic police for a district or category',
      inputSchema: {
        type: 'object',
        properties: {
          district: { type: 'string', description: 'Name of the J&K district (e.g., Baramulla, Srinagar, Ramban, Jammu)' },
          category: { type: 'string', enum: ['traffic', 'rto', 'emergency', 'all'], description: 'Category filter' }
        }
      },
      requiresConfirmation: false,
      execute: async ({ district = '', category = 'all' } = {}) => {
        const dir = (window.SafarData && window.SafarData.DIRECTORY) || [];
        const cleanDist = (district || '').toLowerCase().trim();
        const cleanCat = (category || 'all').toLowerCase().trim();

        let matches = dir.filter(entry => {
          const matchCat = cleanCat === 'all' || entry.category === cleanCat;
          const matchDist = !cleanDist || entry.district.toLowerCase().includes(cleanDist) || entry.name.toLowerCase().includes(cleanDist);
          return matchCat && matchDist;
        });

        // Fallback to broader category if district specific not found
        if (!matches.length && cleanCat !== 'all') {
          matches = dir.filter(entry => entry.category === cleanCat);
        }

        return {
          found: matches.length > 0,
          count: matches.length,
          results: matches.slice(0, 5)
        };
      }
    },

    // 2. Get Emergency Helpline Number
    getEmergencyNumber: {
      name: 'getEmergencyNumber',
      description: 'Retrieve verified emergency numbers (e.g., ERSS 112, NHAI 1033, Ambulance 108, Women 181)',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['highway', 'police', 'ambulance', 'women', 'disaster', 'all'] }
        },
        required: ['type']
      },
      requiresConfirmation: false,
      execute: async ({ type = 'police' } = {}) => {
        const dir = (window.SafarData && window.SafarData.DIRECTORY) || [];
        const emergencies = dir.filter(d => d.category === 'emergency');

        const map = {
          highway: emergencies.find(e => e.number === '1033') || { number: '1033', name: 'NHAI 1033' },
          police: emergencies.find(e => e.number === '112') || { number: '112', name: 'ERSS 112' },
          ambulance: emergencies.find(e => e.number === '108') || { number: '108', name: 'Ambulance 108' },
          women: emergencies.find(e => e.number === '181') || { number: '181', name: 'Women Helpline 181' },
          disaster: emergencies.find(e => e.number === '1070') || { number: '1070', name: 'Disaster Helpline 1070' }
        };

        return map[type] || map.police;
      }
    },

    // 3. Lookup Notified Tariff or Compare Overcharge
    lookupFare: {
      name: 'lookupFare',
      description: 'Verify official notified SRO-97 statutory fare and detect overcharging discrepancy',
      inputSchema: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Departure town or stop' },
          destination: { type: 'string', description: 'Destination town or stop' },
          vehicleType: { type: 'string', description: 'e.g. shared-cab, sumo, matador, auto' },
          demandedFare: { type: 'number', description: 'Amount driver is asking or charged' }
        },
        required: ['origin', 'destination']
      },
      requiresConfirmation: false,
      execute: async ({ origin = '', destination = '', vehicleType = 'shared-cab', demandedFare = null } = {}) => {
        if (window.SafarDisputeEngine && typeof window.SafarDisputeEngine.verifyFare === 'function') {
          const result = window.SafarDisputeEngine.verifyFare(origin, destination, demandedFare || 0);
          return {
            verified: true,
            origin: result.origin,
            destination: result.destination,
            legalFare: result.legalFare,
            demandedFare: demandedFare,
            overcharge: demandedFare ? Math.max(0, demandedFare - result.legalFare) : 0,
            isViolation: demandedFare ? demandedFare > result.legalFare : false,
            source: 'SRO-97 Statutory Tariff Gazette'
          };
        }

        // Fallback default calculation if dispute engine is not yet mounted
        return {
          verified: false,
          origin,
          destination,
          legalFare: null,
          demandedFare,
          source: 'Transport Department SRO-97'
        };
      }
    },

    // 4. Check Highway Corridor Status
    checkHighwayStatus: {
      name: 'checkHighwayStatus',
      description: 'Check highway clearance, tunnel status, or mountain pass conditions (NH-44, Navyug, Mughal Road)',
      inputSchema: {
        type: 'object',
        properties: {
          corridor: { type: 'string', description: 'Highway name e.g. NH-44, Mughal Road, Sinthan Top' },
          district: { type: 'string', description: 'e.g. Ramban, Banihal' }
        }
      },
      requiresConfirmation: false,
      execute: async ({ corridor = 'NH-44', district = 'Ramban' } = {}) => {
        const dir = (window.SafarData && window.SafarData.DIRECTORY) || [];
        const tcrKashmir = dir.find(d => d.number === '01942450022');
        const tcrJammu = dir.find(d => d.number === '01912459048');
        const nhai = dir.find(d => d.number === '1033');

        return {
          corridor,
          district,
          statusNote: 'Corridor advisories are updated continuously by Traffic Police Control Rooms via wireless reports.',
          emergencyNumbers: [
            { name: 'NHAI Emergency Assistance', number: '1033' },
            { name: 'Traffic Control Room Kashmir', number: tcrKashmir ? tcrKashmir.display : '0194-2450022' },
            { name: 'Traffic Control Room Jammu', number: tcrJammu ? tcrJammu.display : '0191-2459048' }
          ]
        };
      }
    },

    // 5. Generate Official Grievance Complaint Text
    generateComplaint: {
      name: 'generateComplaint',
      description: 'Format a structured, legally admissible grievance ready for SMS/WhatsApp/email escalation',
      inputSchema: {
        type: 'object',
        properties: {
          problemTitle: { type: 'string' },
          law: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          demandedFare: { type: 'number' },
          legalFare: { type: 'number' },
          vehiclePlate: { type: 'string' }
        },
        required: ['problemTitle']
      },
      requiresConfirmation: false,
      execute: async ({
        problemTitle = 'Fare Overcharging',
        law = 'Motor Vehicles Act Section 177 / SRO-97',
        origin = window.currentFrom || 'Origin',
        destination = window.currentTo || 'Destination',
        demandedFare = null,
        legalFare = null,
        vehiclePlate = 'COMMUTER-REPORT'
      } = {}) => {
        const routeStr = (origin !== 'Origin' && destination !== 'Destination')
          ? `${origin} to ${destination}`
          : 'J&K Transit Corridor';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date().toLocaleDateString('en-GB');

        const fareDetails = (demandedFare && legalFare)
          ? `\nFare Demanded: ₹${demandedFare} | Statutory Fare: ₹${legalFare} (Discrepancy: ₹${demandedFare - legalFare})`
          : '';

        const text = `COMPLAINT TO J&K TRANSPORT & TRAFFIC POLICE
Date/Time: ${dateStr} at ${timeStr}
Route: ${routeStr}
Vehicle: ${vehiclePlate}
Category: ${problemTitle}
Violation: ${law}${fareDetails}
Action Requested: Verification and statutory enforcement under J&K MVA rules.
Logged via Safar Commuter Portal.`;

        return { complaintText: text };
      }
    },

    // 6. Consequential Action: Initiate Phone Call (Gated by Confirmation)
    initiateCall: {
      name: 'initiateCall',
      description: 'Connect directly to a verified transport authority via phone (requires explicit user confirmation)',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', description: 'Telephone number' },
          name: { type: 'string', description: 'Name of the authority/control room' }
        },
        required: ['number']
      },
      requiresConfirmation: true,
      execute: async ({ number = '', name = 'Authority' } = {}) => {
        if (!number) return { success: false, reason: 'No number provided' };
        if (typeof window !== 'undefined' && window.location) {
          window.location.href = `tel:${number.replace(/[^0-9]/g, '')}`;
        }
        return { success: true, dialed: number, authorityName: name };
      }
    },

    // 7. Consequential Action: Open WhatsApp (Gated by Confirmation)
    openWhatsApp: {
      name: 'openWhatsApp',
      description: 'Open WhatsApp with pre-filled complaint text to Traffic Control Room (requires confirmation)',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'string', description: 'WhatsApp number e.g. 9419035000' },
          message: { type: 'string', description: 'Pre-formatted grievance text' },
          name: { type: 'string' }
        },
        required: ['number', 'message']
      },
      requiresConfirmation: true,
      execute: async ({ number = '9419035000', message = '', name = 'Traffic Control' } = {}) => {
        const cleanNum = number.replace(/[^0-9]/g, '');
        const url = `https://wa.me/91${cleanNum}?text=${encodeURIComponent(message)}`;
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return { success: true, opened: url, authorityName: name };
      }
    }
  };

  /**
   * Execute a tool by name with arguments and optional confirmation bypass
   */
  async function runTool(toolName, args = {}, confirmed = false) {
    const tool = tools[toolName];
    if (!tool) {
      throw new Error(`[SafarTools] Unknown tool: ${toolName}`);
    }

    if (tool.requiresConfirmation && !confirmed) {
      return {
        needsConfirmation: true,
        toolName,
        args,
        prompt: `Would you like me to ${toolName === 'initiateCall' ? 'call' : 'open WhatsApp for'} ${args.name || args.number || 'the authority'}?`
      };
    }

    return await tool.execute(args);
  }

  function getTool(name) {
    return tools[name] || null;
  }

  function getAllToolSchemas() {
    return Object.values(tools).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      requiresConfirmation: t.requiresConfirmation
    }));
  }

  return {
    tools,
    getTool,
    getAllToolSchemas,
    runTool
  };
})();

// Attach to global scope
if (typeof window !== 'undefined') {
  window.SafarTools = SafarTools;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarTools = SafarTools;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafarTools;
}
