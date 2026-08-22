/**
 * Safar Admin Chunked CSV Parser Module (admin-csv-parser.js)
 * Production CSV Parsing: Chunked 50 rows/tick using setTimeout, DOMPurify sanitization, J&K bounds, stop_name regex validation.
 */
(function (window) {
  'use strict';

  const JK_BOUNDS = { MIN_LAT: 32.0, MAX_LAT: 37.0, MIN_LNG: 73.0, MAX_LNG: 79.0 };
  const STOP_NAME_REGEX = /^[a-zA-Z0-9\s\-\.,()]+$/;
  const CHUNK_SIZE = 50;

  /**
   * Parses CSV string asynchronously in 50-row chunks
   * @param {string} csvContent 
   * @param {function(number)} onProgress Progress callback (0 to 100)
   * @returns {Promise<{ validRows: Array, errors: Array }>}
   */
  function parseCsvInChunks(csvContent, onProgress) {
    return new Promise((resolve) => {
      const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        return resolve({ validRows: [], errors: ['CSV file is empty or contains no data rows.'] });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);
      const totalRows = dataLines.length;

      const validRows = [];
      const errors = [];
      let currentIndex = 0;

      function processChunk() {
        const nextBatchLimit = Math.min(currentIndex + CHUNK_SIZE, totalRows);

        for (let i = currentIndex; i < nextBatchLimit; i++) {
          const rowNum = i + 1;
          const cols = dataLines[i].split(',').map(c => c.trim());

          if (cols.length < 5) {
            errors.push(`Row ${rowNum}: Insufficient columns (expected route_code, stop_sequence, stop_name, latitude, longitude).`);
            continue;
          }

          const rawRouteCode = cols[0];
          const rawSeq = cols[1];
          const rawStopName = cols[2];
          const rawLat = cols[3];
          const rawLng = cols[4];

          // 1. Sanitize input
          const cleanStopName = window.AdminSecurity ? window.AdminSecurity.sanitizeInput(rawStopName) : rawStopName;

          // 2. Validate stop_name regex
          if (!STOP_NAME_REGEX.test(cleanStopName)) {
            errors.push(`Row ${rowNum}: Validation Failed [ERR_STOP_NAME_INVALID]: Invalid characters in stop_name "${rawStopName}".`);
            continue;
          }

          // 3. Validate sequence
          const seq = parseInt(rawSeq, 10);
          if (isNaN(seq) || seq <= 0) {
            errors.push(`Row ${rowNum}: Validation Failed [ERR_STOP_INVALID_SEQ]: stop_sequence must be a positive integer.`);
            continue;
          }

          // 4. Validate J&K Lat/Lng bounds
          const lat = parseFloat(rawLat);
          const lng = parseFloat(rawLng);

          if (isNaN(lat) || lat < JK_BOUNDS.MIN_LAT || lat > JK_BOUNDS.MAX_LAT || isNaN(lng) || lng < JK_BOUNDS.MIN_LNG || lng > JK_BOUNDS.MAX_LNG) {
            errors.push(`Row ${rowNum}: Validation Failed [ERR_STOP_BOUNDS]: Stop "${cleanStopName}" coordinates (${rawLat}, ${rawLng}) outside J&K bounds (Lat: 32°–37° N, Lng: 73°–79° E).`);
            continue;
          }

          validRows.push({
            route_code: rawRouteCode,
            stop_sequence: seq,
            stop_name: cleanStopName,
            latitude: lat,
            longitude: lng
          });
        }

        currentIndex = nextBatchLimit;
        const progressPercent = Math.round((currentIndex / totalRows) * 100);
        if (typeof onProgress === 'function') {
          onProgress(progressPercent);
        }

        if (currentIndex < totalRows) {
          setTimeout(processChunk, 0);
        } else {
          resolve({ validRows, errors });
        }
      }

      processChunk();
    });
  }

  /**
   * Polls CSV import transaction status until terminal state
   */
  async function pollImportStatus(importId, onUpdate) {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/v1/admin/routes/import-csv-status?importId=${encodeURIComponent(importId)}`);
        const json = await res.json();

        if (json.success && json.data) {
          if (typeof onUpdate === 'function') {
            onUpdate(json.data);
          }
          if (json.data.status === 'SUCCESS' || json.data.status === 'FAILED' || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }
      } catch (e) {
        if (attempts >= maxAttempts) clearInterval(interval);
      }
    }, 1000);
  }

  // Export module to global scope
  window.AdminCsvParser = {
    parseCsvInChunks,
    pollImportStatus
  };

})(window);
