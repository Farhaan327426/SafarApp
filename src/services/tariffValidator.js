/**
 * SAFAR — Tariff Schedule Validator
 * Validates incoming tariff payloads against strict statutory schema and discriminated rate contracts.
 */

const CANONICAL_VEHICLES = [
  'e-rickshaw',
  'e-auto',
  'auto',
  'tata-magic',
  'mini-bus',
  'private-bus',
  'shared-cab',
  'taxi-sedan',
  'taxi-suv',
  'force-traveler',
  'vikram-tempo'
];

const REQUIRED_TERRAIN_REGIONS = [
  'kashmir-plain',
  'kashmir-hill',
  'jammu-plain',
  'jammu-hill'
];

/**
 * Validates ISO 8601 date string.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validates a complete Tariff Schedule payload.
 *
 * @param {unknown} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateTariffSchedule(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Payload must be a non-null object'] };
  }

  const p = /** @type {Record<string, any>} */ (payload);

  if (typeof p.schemaVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(p.schemaVersion)) {
    errors.push('schemaVersion must be a semver string (e.g. 1.0.0)');
  }

  if (typeof p.activeScheduleId !== 'string' || p.activeScheduleId.trim().length === 0) {
    errors.push('activeScheduleId must be a non-empty string');
  }

  if (typeof p.publishedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.publishedDate)) {
    errors.push('publishedDate must be a date string in YYYY-MM-DD format');
  }

  if (!isValidDate(p.publishedAt)) {
    errors.push('publishedAt must be a valid ISO 8601 date string');
  }

  if (!isValidDate(p.effectiveFrom)) {
    errors.push('effectiveFrom must be a valid ISO 8601 date string');
  }

  if (p.validUntil !== null && !isValidDate(p.validUntil)) {
    errors.push('validUntil must be an ISO 8601 date string or null');
  }

  if (typeof p.amendmentSequence !== 'number' || p.amendmentSequence < 0 || !Number.isInteger(p.amendmentSequence)) {
    errors.push('amendmentSequence must be a non-negative integer');
  }

  if (typeof p.checksum !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(p.checksum)) {
    errors.push('checksum must be a valid sha256 hash string (sha256:64hex)');
  }

  // Provenance metadata strict validation
  if (!p.provenanceMetadata || typeof p.provenanceMetadata !== 'object') {
    errors.push('provenanceMetadata must be an object');
  } else {
    const metaFields = [
      'sourceReference',
      'baselineSource',
      'evStatutoryClause',
      'nonEvRevisionBasis',
      'issuingAuthority'
    ];
    for (const f of metaFields) {
      if (typeof p.provenanceMetadata[f] !== 'string' || p.provenanceMetadata[f].trim().length === 0) {
        errors.push(`provenanceMetadata.${f} must be a non-empty string`);
      }
    }
  }

  if (!p.tariffs || typeof p.tariffs !== 'object' || Array.isArray(p.tariffs)) {
    errors.push('tariffs must be an object');
    return { isValid: false, errors };
  }

  // Validate every canonical vehicle key
  for (const vId of CANONICAL_VEHICLES) {
    const tariff = p.tariffs[vId];
    if (!tariff || typeof tariff !== 'object') {
      errors.push(`tariffs missing entry for vehicle: ${vId}`);
      continue;
    }

    if (tariff.currency !== 'INR') {
      errors.push(`tariffs.${vId}.currency must be "INR"`);
    }

    // Derivation validation
    if (!tariff.derivation || typeof tariff.derivation !== 'object') {
      errors.push(`tariffs.${vId} missing derivation object`);
    } else {
      if (typeof tariff.derivation.legalBasis !== 'string') {
        errors.push(`tariffs.${vId}.derivation.legalBasis must be a string`);
      }
      if (typeof tariff.derivation.adjustment !== 'string') {
        errors.push(`tariffs.${vId}.derivation.adjustment must be a string`);
      }
      if (typeof tariff.derivation.absoluteRateSource !== 'string') {
        errors.push(`tariffs.${vId}.derivation.absoluteRateSource must be a string`);
      }
    }

    // Discriminated calculation model check
    switch (tariff.calculationType) {
      case 'PER_KM':
        if (typeof tariff.perKm !== 'number' || tariff.perKm <= 0) {
          errors.push(`tariffs.${vId} (PER_KM) requires positive perKm`);
        }
        break;

      case 'FIRST_KM_PLUS_SUBSEQUENT':
        if (typeof tariff.firstKm !== 'number' || tariff.firstKm <= 0) {
          errors.push(`tariffs.${vId} (FIRST_KM_PLUS_SUBSEQUENT) requires positive firstKm`);
        }
        if (typeof tariff.subsequentKm !== 'number' || tariff.subsequentKm <= 0) {
          errors.push(`tariffs.${vId} (FIRST_KM_PLUS_SUBSEQUENT) requires positive subsequentKm`);
        }
        break;

      case 'BASE_PLUS_PER_KM':
        if (typeof tariff.baseFare !== 'number' || tariff.baseFare <= 0) {
          errors.push(`tariffs.${vId} (BASE_PLUS_PER_KM) requires positive baseFare`);
        }
        if (typeof tariff.perKm !== 'number' || tariff.perKm <= 0) {
          errors.push(`tariffs.${vId} (BASE_PLUS_PER_KM) requires positive perKm`);
        }
        break;

      case 'MIN_PLUS_PER_KM':
        if (typeof tariff.minFare !== 'number' || tariff.minFare <= 0) {
          errors.push(`tariffs.${vId} (MIN_PLUS_PER_KM) requires positive minFare`);
        }
        if (typeof tariff.perKm !== 'number' || tariff.perKm <= 0) {
          errors.push(`tariffs.${vId} (MIN_PLUS_PER_KM) requires positive perKm`);
        }
        break;

      case 'TERRAIN_RATE':
        if (typeof tariff.minFare !== 'number' || tariff.minFare <= 0) {
          errors.push(`tariffs.${vId} (TERRAIN_RATE) requires positive minFare`);
        }
        if (!tariff.ratesByTerrain || typeof tariff.ratesByTerrain !== 'object') {
          errors.push(`tariffs.${vId} (TERRAIN_RATE) requires ratesByTerrain object`);
        } else {
          for (const reg of REQUIRED_TERRAIN_REGIONS) {
            if (typeof tariff.ratesByTerrain[reg] !== 'number' || tariff.ratesByTerrain[reg] <= 0) {
              errors.push(`tariffs.${vId} (TERRAIN_RATE) requires positive ratesByTerrain.${reg}`);
            }
          }
        }
        break;

      default:
        errors.push(`tariffs.${vId} has unknown calculationType: ${tariff.calculationType}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
