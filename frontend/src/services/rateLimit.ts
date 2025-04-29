interface RateLimitData {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpiry: number | null;
}

const RATE_LIMIT_KEY = "admin_login_rate_limit";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const getRateLimitData = (): RateLimitData => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (!stored) {
    return {
      attempts: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false,
      blockExpiry: null,
    };
  }
  return JSON.parse(stored);
};

export const updateRateLimit = (): {
  blocked: boolean;
  remainingAttempts: number;
  blockExpiry: number | null;
} => {
  const now = Date.now();
  let data = getRateLimitData();

  // Check if block has expired
  if (data.blocked && data.blockExpiry && now > data.blockExpiry) {
    data = {
      attempts: 0,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockExpiry: null,
    };
  }

  // If blocked, return current status
  if (data.blocked) {
    return {
      blocked: true,
      remainingAttempts: 0,
      blockExpiry: data.blockExpiry,
    };
  }

  // Reset if window has expired
  if (now - data.firstAttempt > WINDOW_MS) {
    data = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockExpiry: null,
    };
  } else {
    // Increment attempts
    data.attempts += 1;
    data.lastAttempt = now;

    // Check if should block
    if (data.attempts >= MAX_ATTEMPTS) {
      data.blocked = true;
      data.blockExpiry = now + BLOCK_DURATION_MS;
    }
  }

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));

  return {
    blocked: data.blocked,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - data.attempts),
    blockExpiry: data.blockExpiry,
  };
};

export const resetRateLimit = () => {
  localStorage.removeItem(RATE_LIMIT_KEY);
};
