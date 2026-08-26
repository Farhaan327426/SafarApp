const SENSITIVE_KEYS = new Set([
  'upi_id', 'upiid', 'bank_account', 'accountnumber', 'ifsc',
  'password', 'otpcode', 'otp', 'secret', 'authorization', 'cookie', 'token',
  'pin', 'adminpin', 'admin_pin', 'apikey', 'api_key', 'jwt', 'credential', 'card', 'cvv'
]);

function deepRedact(obj, seen = new WeakSet()) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (seen.has(obj)) return '[CIRCULAR]';
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => deepRedact(item, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.has(lowerKey) || Array.from(SENSITIVE_KEYS).some(k => lowerKey.includes(k));

    if (isSensitive) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = deepRedact(value, seen);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = { deepRedact };
