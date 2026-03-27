/**
 * Shared constants used across frontend and backend
 */
module.exports = {
  API_VERSION: 'v1',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  TOKEN_EXPIRY: '24h',
  BCRYPT_ROUNDS: 12
};
