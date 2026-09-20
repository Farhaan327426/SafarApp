/**
 * Safar AI - Language Normalization Service (Stage 6)
 *
 * Supports English, Urdu, Hindi, and Romanized Hindi/Urdu.
 * Cleans punctuation, normalizes spacing, and identifies script.
 */

const URDU_REGEX = /[\u0600-\u06FF]/;
const HINDI_REGEX = /[\u0900-\u097F]/;

/**
 * Normalizes input user query for AI classification and entity extraction.
 *
 * @param {string} rawQuery - Unsanitized user message
 * @returns {Object} Normalized representation
 */
export function normalizeQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      raw: '',
      normalized: '',
      detectedScript: 'en',
      tokens: []
    };
  }

  const raw = rawQuery.trim();
  let normalized = raw.toLowerCase();

  // Detect script
  let detectedScript = 'en';
  if (URDU_REGEX.test(raw)) {
    detectedScript = 'ur';
  } else if (HINDI_REGEX.test(raw)) {
    detectedScript = 'hi';
  } else if (/\b(se|ka|ki|ke|hai|kya|kab|batao|chahiye|kitna|liye|jana)\b/i.test(normalized)) {
    detectedScript = 'romanized';
  }

  // Normalize consecutive whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  // Standardize directional arrows
  normalized = normalized.replace(/\s*->\s*/g, ' → ');

  return {
    raw,
    normalized,
    detectedScript,
    tokens: normalized.split(' ').filter(Boolean)
  };
}
