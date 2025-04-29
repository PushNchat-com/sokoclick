/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Authentication Configuration
  readonly VITE_TRUSTED_ADMIN_EMAILS: string;
  readonly VITE_SESSION_TIMEOUT_MS: string;
  readonly VITE_MAX_LOGIN_ATTEMPTS: string;
  readonly VITE_LOGIN_ATTEMPT_WINDOW_MS: string;
  readonly VITE_PASSWORD_MIN_LENGTH: string;
  readonly VITE_REQUIRE_STRONG_PASSWORD: string;
  readonly VITE_TOKEN_REFRESH_BUFFER_MS: string;
  readonly VITE_CSP_UNSAFE_EVAL_ALLOWED: string;

  // Storage Configuration
  readonly VITE_AUTH_PERSISTENCE: "local" | "session" | "memory";
  readonly VITE_AUTH_CACHE_TTL_MS: string;

  // Development Settings
  readonly VITE_ENABLE_MOCK_AUTH: string;
  readonly VITE_LOG_AUTH_EVENTS: string;
  readonly VITE_VERBOSE_AUTH_ERRORS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Example .env file contents:
/*
# Authentication Configuration
VITE_TRUSTED_ADMIN_EMAILS=sokoclick.com@gmail.com,pushns24@gmail.com
VITE_SESSION_TIMEOUT_MS=3600000
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOGIN_ATTEMPT_WINDOW_MS=300000
VITE_PASSWORD_MIN_LENGTH=8
VITE_REQUIRE_STRONG_PASSWORD=true
VITE_TOKEN_REFRESH_BUFFER_MS=300000
VITE_CSP_UNSAFE_EVAL_ALLOWED=false

# Storage Configuration
VITE_AUTH_PERSISTENCE=local
VITE_AUTH_CACHE_TTL_MS=3600000

# Development Settings
VITE_ENABLE_MOCK_AUTH=false
VITE_LOG_AUTH_EVENTS=false
VITE_VERBOSE_AUTH_ERRORS=false
*/
