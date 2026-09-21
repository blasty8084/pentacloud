// Sanitize error messages to remove sensitive data (credentials, tokens, keys, passwords, secrets, DB URLs)
export const sanitizeError = (err) => {
  const message = err.message || String(err);
  return message
    .replace(/applicationKeyId[=:]\s*[^\s,}]+/gi, 'applicationKeyId=***')
    .replace(/applicationKey[=:]\s*[^\s,}]+/gi, 'applicationKey=***')
    .replace(/authorization[=:]\s*[^\s,}]+/gi, 'authorization=***')
    .replace(/authToken[=:]\s*[^\s,}]+/gi, 'authToken=***')
    .replace(/keyId[=:]\s*[^\s,}]+/gi, 'keyId=***')
    .replace(/appKey[=:]\s*[^\s,}]+/gi, 'appKey=***')
    .replace(/password[=:]\s*[^\s,}]+/gi, 'password=***')
    .replace(/secret[=:]\s*[^\s,}]+/gi, 'secret=***')
    .replace(/postgresql:\/\/[^:]+:[^@]+@/gi, 'postgresql://***:***@');
};