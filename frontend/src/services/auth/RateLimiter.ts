import { AuthConfig } from "./AuthConfig";

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

/**
 * Rate limiter for authentication attempts
 * Prevents brute force attacks by limiting login attempts
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private readonly storage: Storage;
  private readonly attempts: Map<string, AttemptRecord> = new Map();

  private constructor() {
    this.storage = window.sessionStorage;
    this.loadAttempts();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter();
    }
    return this.instance;
  }

  /**
   * Load attempts from storage
   */
  private loadAttempts(): void {
    try {
      const stored = this.storage.getItem("auth_attempts");
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          this.attempts.set(key, value as AttemptRecord);
        });
      }
    } catch (error) {
      console.error("[RateLimiter] Failed to load attempts:", error);
    }
  }

  /**
   * Save attempts to storage
   */
  private saveAttempts(): void {
    try {
      const data = Object.fromEntries(this.attempts.entries());
      this.storage.setItem("auth_attempts", JSON.stringify(data));
    } catch (error) {
      console.error("[RateLimiter] Failed to save attempts:", error);
    }
  }

  /**
   * Clean up old attempts
   */
  private cleanup(): void {
    const now = Date.now();
    const window = AuthConfig.SECURITY.LOGIN_ATTEMPT_WINDOW_MS;

    for (const [key, record] of this.attempts.entries()) {
      if (now - record.lastAttempt > window) {
        this.attempts.delete(key);
      }
    }

    this.saveAttempts();
  }

  /**
   * Record an authentication attempt
   * @param identifier - Usually email address
   * @returns true if the attempt is allowed, false if rate limited
   */
  recordAttempt(identifier: string): boolean {
    this.cleanup();

    const now = Date.now();
    const key = identifier.toLowerCase();
    const record = this.attempts.get(key);

    if (!record) {
      // First attempt
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      this.saveAttempts();
      return true;
    }

    // Check if we're still within the window
    const age = now - record.firstAttempt;
    if (age > AuthConfig.SECURITY.LOGIN_ATTEMPT_WINDOW_MS) {
      // Reset if window has expired
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      this.saveAttempts();
      return true;
    }

    // Increment attempt count
    record.count++;
    record.lastAttempt = now;
    this.attempts.set(key, record);
    this.saveAttempts();

    // Check if we've exceeded the limit
    return record.count <= AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Check if an identifier is currently rate limited
   */
  isRateLimited(identifier: string): boolean {
    this.cleanup();

    const key = identifier.toLowerCase();
    const record = this.attempts.get(key);

    if (!record) return false;

    // Check if we're still within the window
    const age = Date.now() - record.firstAttempt;
    if (age > AuthConfig.SECURITY.LOGIN_ATTEMPT_WINDOW_MS) {
      this.attempts.delete(key);
      this.saveAttempts();
      return false;
    }

    return record.count > AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Get remaining attempts for an identifier
   */
  getRemainingAttempts(identifier: string): number {
    this.cleanup();

    const key = identifier.toLowerCase();
    const record = this.attempts.get(key);

    if (!record) return AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS;

    // Check if we're still within the window
    const age = Date.now() - record.firstAttempt;
    if (age > AuthConfig.SECURITY.LOGIN_ATTEMPT_WINDOW_MS) {
      this.attempts.delete(key);
      this.saveAttempts();
      return AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS;
    }

    return Math.max(0, AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS - record.count);
  }

  /**
   * Get time remaining in rate limit window
   * @returns milliseconds remaining, or 0 if not rate limited
   */
  getTimeRemaining(identifier: string): number {
    this.cleanup();

    const key = identifier.toLowerCase();
    const record = this.attempts.get(key);

    if (!record || record.count <= AuthConfig.SECURITY.MAX_LOGIN_ATTEMPTS) {
      return 0;
    }

    const elapsed = Date.now() - record.firstAttempt;
    return Math.max(0, AuthConfig.SECURITY.LOGIN_ATTEMPT_WINDOW_MS - elapsed);
  }

  /**
   * Reset attempts for an identifier
   */
  reset(identifier: string): void {
    const key = identifier.toLowerCase();
    this.attempts.delete(key);
    this.saveAttempts();
  }

  /**
   * Clear all rate limiting data
   */
  clear(): void {
    this.attempts.clear();
    this.storage.removeItem("auth_attempts");
  }
}
