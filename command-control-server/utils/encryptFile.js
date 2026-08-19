/**
 * SAFAR — AES-256-GCM File & Buffer Encryption Utility
 * Encrypts driver KYC documents at rest with a 12-byte IV and 16-byte GCM authentication tag.
 */

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.SAFAR_ENCRYPTION_KEY
  ? Buffer.from(process.env.SAFAR_ENCRYPTION_KEY, 'hex')
  : crypto.scryptSync(process.env.SAFAR_SECRET_PHRASE || 'safar_default_secure_vault_phrase_2026', 'safar_salt_jk_transit', 32);

/**
 * Encrypts a buffer using AES-256-GCM
 * Format: [12 bytes IV] + [16 bytes AuthTag] + [Ciphertext]
 */
function encryptBuffer(buffer, key = ENCRYPTION_KEY) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts a buffer produced by encryptBuffer
 */
function decryptBuffer(encryptedBuffer, key = ENCRYPTION_KEY) {
  if (encryptedBuffer.length < 28) {
    throw new Error('Invalid encrypted payload: too short for AES-256-GCM envelope');
  }
  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  ENCRYPTION_KEY
};
