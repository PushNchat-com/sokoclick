import { LocalizedMessage } from "../../types/auth";

/**
 * Authentication configuration service
 * Handles all environment-specific configuration for authentication
 */
export class AuthConfig {
  // Environment-based configuration
  static readonly ENV = {
    isDevelopment: import.meta.env.MODE === "development",
    isTest: import.meta.env.MODE === "test",
    isProduction: import.meta.env.MODE === "production",
  } as const;

  // Security settings
  static readonly SECURITY = {
    TRUSTED_ADMIN_EMAILS: [
      "sokoclick.com@gmail.com",
      "pushns24@gmail.com",
    ] as const,
    SESSION_TIMEOUT_MS: parseInt(
      import.meta.env.VITE_SESSION_TIMEOUT_MS || "3600000",
    ), // 1 hour default
    MAX_LOGIN_ATTEMPTS: parseInt(
      import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || "5",
    ),
    LOGIN_ATTEMPT_WINDOW_MS: parseInt(
      import.meta.env.VITE_LOGIN_ATTEMPT_WINDOW_MS || "300000",
    ), // 5 minutes
    PASSWORD_MIN_LENGTH: parseInt(
      import.meta.env.VITE_PASSWORD_MIN_LENGTH || "8",
    ),
    REQUIRE_STRONG_PASSWORD:
      import.meta.env.VITE_REQUIRE_STRONG_PASSWORD !== "false",
    TOKEN_REFRESH_BUFFER_MS: parseInt(
      import.meta.env.VITE_TOKEN_REFRESH_BUFFER_MS || "300000",
    ), // 5 minutes
    CSP_UNSAFE_EVAL_ALLOWED:
      import.meta.env.VITE_CSP_UNSAFE_EVAL_ALLOWED === "true",
  } as const;

  // Storage configuration
  static readonly STORAGE = {
    AUTH_STORAGE_KEY: "sokoclick_auth_state",
    PERSISTENCE_MODE: (import.meta.env.VITE_AUTH_PERSISTENCE || "local") as
      | "local"
      | "session"
      | "memory",
    STATE_VERSION: "1", // Increment when storage format changes
    CACHE_TTL_MS: parseInt(import.meta.env.VITE_AUTH_CACHE_TTL_MS || "3600000"), // 1 hour
  } as const;

  // Error messages
  static readonly ERRORS: Record<string, LocalizedMessage> = {
    INVALID_CREDENTIALS: {
      en: "Invalid email or password. Please check your credentials and try again.",
      fr: "Email ou mot de passe invalide. Veuillez vérifier vos identifiants et réessayer.",
    },
    ACCOUNT_LOCKED: {
      en: "Account temporarily locked. Please try again in a few minutes.",
      fr: "Compte temporairement verrouillé. Veuillez réessayer dans quelques minutes.",
    },
    SESSION_EXPIRED: {
      en: "Your session has expired. Please sign in again to continue.",
      fr: "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
    },
    NETWORK_ERROR: {
      en: "Network error. Please check your internet connection and try again.",
      fr: "Erreur réseau. Veuillez vérifier votre connexion internet et réessayer.",
    },
    SERVER_ERROR: {
      en: "An error occurred while processing your request. Please try again later.",
      fr: "Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.",
    },
    RATE_LIMIT_EXCEEDED: {
      en: "Too many login attempts. Please wait before trying again.",
      fr: "Trop de tentatives de connexion. Veuillez patienter avant de réessayer.",
    },
    WEAK_PASSWORD: {
      en: "Password is too weak. It must be at least 8 characters long and include a mix of letters, numbers, and special characters.",
      fr: "Le mot de passe est trop faible. Il doit comporter au moins 8 caractères et inclure un mélange de lettres, de chiffres et de caractères spéciaux.",
    },
    UNAUTHORIZED_ACCESS: {
      en: "You do not have admin privileges to access this resource. Please contact your administrator.",
      fr: "Vous n'avez pas les privilèges administrateur pour accéder à cette ressource. Veuillez contacter votre administrateur.",
    },
    PROFILE_NOT_FOUND: {
      en: "User profile not found. Please contact support if this issue persists.",
      fr: "Profil utilisateur introuvable. Veuillez contacter le support si ce problème persiste.",
    },
  } as const;

  // Development settings
  static readonly DEV = {
    MOCK_AUTH_ENABLED:
      import.meta.env.VITE_ENABLE_MOCK_AUTH === "true" &&
      this.ENV.isDevelopment,
    LOG_AUTH_EVENTS: import.meta.env.VITE_LOG_AUTH_EVENTS !== "false",
    VERBOSE_ERRORS:
      import.meta.env.VITE_VERBOSE_AUTH_ERRORS === "true" &&
      !this.ENV.isProduction,
  } as const;

  /**
   * Validate the configuration
   * @throws Error if configuration is invalid
   */
  static validate(): void {
    // Session timeout must be positive
    if (this.SECURITY.SESSION_TIMEOUT_MS <= 0) {
      throw new Error("Invalid SESSION_TIMEOUT_MS configuration");
    }

    // Login attempt window must be positive
    if (this.SECURITY.LOGIN_ATTEMPT_WINDOW_MS <= 0) {
      throw new Error("Invalid LOGIN_ATTEMPT_WINDOW_MS configuration");
    }

    // Password length must be reasonable
    if (
      this.SECURITY.PASSWORD_MIN_LENGTH < 8 ||
      this.SECURITY.PASSWORD_MIN_LENGTH > 128
    ) {
      throw new Error("Invalid PASSWORD_MIN_LENGTH configuration");
    }

    // Token refresh buffer must be positive and less than session timeout
    if (
      this.SECURITY.TOKEN_REFRESH_BUFFER_MS <= 0 ||
      this.SECURITY.TOKEN_REFRESH_BUFFER_MS >= this.SECURITY.SESSION_TIMEOUT_MS
    ) {
      throw new Error("Invalid TOKEN_REFRESH_BUFFER_MS configuration");
    }

    // Cache TTL must be positive
    if (this.STORAGE.CACHE_TTL_MS <= 0) {
      throw new Error("Invalid CACHE_TTL_MS configuration");
    }

    // Validate persistence mode
    if (
      !["local", "session", "memory"].includes(this.STORAGE.PERSISTENCE_MODE)
    ) {
      throw new Error("Invalid PERSISTENCE_MODE configuration");
    }

    // Warn about unsafe development settings in production
    if (this.ENV.isProduction) {
      if (this.DEV.MOCK_AUTH_ENABLED) {
        console.warn(
          "WARNING: Mock authentication should not be enabled in production",
        );
      }
      if (this.SECURITY.CSP_UNSAFE_EVAL_ALLOWED) {
        console.warn(
          "WARNING: Unsafe eval should not be allowed in production",
        );
      }
      if (this.DEV.VERBOSE_ERRORS) {
        console.warn(
          "WARNING: Verbose errors should not be enabled in production",
        );
      }
    }
  }

  /**
   * Get error message in the current language
   */
  static getError(
    key: keyof typeof this.ERRORS,
    lang: "en" | "fr" = "en",
  ): string {
    return this.ERRORS[key]?.[lang] || this.ERRORS.SERVER_ERROR[lang];
  }

  /**
   * Check if an email is in the trusted admins list
   */
  static isTrustedAdmin(email: string): boolean {
    return this.SECURITY.TRUSTED_ADMIN_EMAILS.includes(
      email.toLowerCase() as (typeof this.SECURITY.TRUSTED_ADMIN_EMAILS)[number],
    );
  }

  /**
   * Initialize the configuration
   * @throws Error if configuration is invalid
   */
  static init(): void {
    this.validate();

    // Log configuration in development
    if (this.ENV.isDevelopment && this.DEV.LOG_AUTH_EVENTS) {
      console.log("[AuthConfig] Initialized with:", {
        env: this.ENV,
        security: {
          ...this.SECURITY,
          // Don't log sensitive values
          TRUSTED_ADMIN_EMAILS: "***",
        },
        storage: this.STORAGE,
        dev: this.DEV,
      });
    }
  }
}
