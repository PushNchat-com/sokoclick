import { Session } from "@supabase/supabase-js";
import { AuthConfig } from "./AuthConfig";

/**
 * Secure session manager for handling session encryption and storage
 * Uses Web Crypto API for encryption in supported environments
 */
export class SecureSessionManager {
  private static instance: SecureSessionManager;
  private readonly storage: Storage;
  private readonly crypto: SubtleCrypto;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {
    // Choose storage based on configuration
    this.storage =
      AuthConfig.STORAGE.PERSISTENCE_MODE === "local"
        ? window.localStorage
        : window.sessionStorage;

    // Get crypto instance
    this.crypto = window.crypto.subtle;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SecureSessionManager {
    if (!this.instance) {
      this.instance = new SecureSessionManager();
    }
    return this.instance;
  }

  /**
   * Initialize encryption key
   * @throws Error if encryption is not supported
   */
  private async initEncryption(): Promise<void> {
    if (this.encryptionKey) return;

    try {
      // Generate a secure key for session encryption
      this.encryptionKey = await this.crypto.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );
    } catch (error) {
      console.error("[SecureSessionManager] Encryption not supported:", error);
      throw new Error(
        "Secure session storage not supported in this environment",
      );
    }
  }

  /**
   * Encrypt session data
   */
  private async encrypt(data: string): Promise<string> {
    await this.initEncryption();
    if (!this.encryptionKey) throw new Error("Encryption not initialized");

    try {
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encode data
      const encodedData = new TextEncoder().encode(data);

      // Encrypt
      const encryptedData = await this.crypto.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        this.encryptionKey,
        encodedData,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error("[SecureSessionManager] Encryption failed:", error);
      throw new Error("Failed to encrypt session data");
    }
  }

  /**
   * Decrypt session data
   */
  private async decrypt(encrypted: string): Promise<string> {
    await this.initEncryption();
    if (!this.encryptionKey) throw new Error("Encryption not initialized");

    try {
      // Decode base64
      const combined = new Uint8Array(
        atob(encrypted)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );

      // Extract IV and data
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      // Decrypt
      const decrypted = await this.crypto.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        this.encryptionKey,
        data,
      );

      // Decode result
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("[SecureSessionManager] Decryption failed:", error);
      throw new Error("Failed to decrypt session data");
    }
  }

  /**
   * Store session securely
   */
  async storeSession(session: Session | null): Promise<void> {
    try {
      if (!session) {
        this.storage.removeItem(AuthConfig.STORAGE.AUTH_STORAGE_KEY);
        return;
      }

      const data = {
        session,
        version: AuthConfig.STORAGE.STATE_VERSION,
        timestamp: Date.now(),
      };

      const encrypted = await this.encrypt(JSON.stringify(data));
      this.storage.setItem(AuthConfig.STORAGE.AUTH_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error("[SecureSessionManager] Failed to store session:", error);
      // Fall back to storing unencrypted in memory only
      if (AuthConfig.ENV.isDevelopment) {
        console.warn(
          "[SecureSessionManager] Falling back to unencrypted storage",
        );
        this.storage.setItem(
          AuthConfig.STORAGE.AUTH_STORAGE_KEY,
          JSON.stringify({ session, timestamp: Date.now() }),
        );
      }
    }
  }

  /**
   * Retrieve stored session
   */
  async getStoredSession(): Promise<Session | null> {
    try {
      const stored = this.storage.getItem(AuthConfig.STORAGE.AUTH_STORAGE_KEY);
      if (!stored) return null;

      let data: { session: Session; version: string; timestamp: number };

      try {
        // Try to decrypt
        const decrypted = await this.decrypt(stored);
        data = JSON.parse(decrypted);
      } catch (error) {
        // Fall back to parsing unencrypted data in development
        if (AuthConfig.ENV.isDevelopment) {
          console.warn("[SecureSessionManager] Reading unencrypted session");
          data = JSON.parse(stored);
        } else {
          throw error;
        }
      }

      // Validate version
      if (data.version !== AuthConfig.STORAGE.STATE_VERSION) {
        console.warn("[SecureSessionManager] Stored session version mismatch");
        return null;
      }

      // Check expiry
      const age = Date.now() - data.timestamp;
      if (age > AuthConfig.SECURITY.SESSION_TIMEOUT_MS) {
        console.warn("[SecureSessionManager] Stored session expired");
        this.storage.removeItem(AuthConfig.STORAGE.AUTH_STORAGE_KEY);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error(
        "[SecureSessionManager] Failed to retrieve session:",
        error,
      );
      return null;
    }
  }

  /**
   * Clear stored session
   */
  clearSession(): void {
    try {
      this.storage.removeItem(AuthConfig.STORAGE.AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("[SecureSessionManager] Failed to clear session:", error);
    }
  }
}
