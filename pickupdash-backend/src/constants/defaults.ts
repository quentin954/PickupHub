export const RATE_LIMIT = {
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX_ATTEMPTS: 5,
  API_WINDOW_MS: 15 * 60 * 1000,
  API_MAX_REQUESTS: 100,
} as const;

export const BCRYPT_ROUNDS = 12;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;