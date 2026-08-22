const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRITICAL] ENCRYPTION_KEY must be a 64-character hex string in production!');
      process.exit(1);
    }
    // Fallback key for development/test environment
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }
  return Buffer.from(keyHex, 'hex');
}

function encryptField(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  // If already encrypted (format iv:authTag:encrypted), return as is
  if (plaintext.split(':').length === 3 && plaintext.length > 40) {
    return plaintext;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptField(cipherString) {
  if (!cipherString || typeof cipherString !== 'string') return cipherString;
  const parts = cipherString.split(':');
  if (parts.length !== 3) return cipherString; // Plaintext fallback

  const [ivHex, authTagHex, encryptedHex] = parts;
  if (!ivHex || !authTagHex || !encryptedHex) return cipherString;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Decryption failed, returning fallback:', err.message);
    return cipherString;
  }
}

function hashOtp(otpCode) {
  return crypto.createHash('sha256').update(String(otpCode)).digest('hex');
}

module.exports = {
  encryptField,
  decryptField,
  hashOtp,
  getEncryptionKey
};
