/**
 * Safar AI - Language Normalization Service (Stage 1 Stub)
 * Languages in V1: English, Urdu, Hindi, and Romanized Hindi/Urdu.
 * Normalization logic will be implemented in subsequent stage.
 */

export function normalizeQuery(rawQuery) {
  return {
    raw: rawQuery,
    normalized: (rawQuery || '').trim().toLowerCase(),
    status: "stub"
  };
}
