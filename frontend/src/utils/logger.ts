/**
 * Logger utility for application-wide logging
 * Provides consistent logging with context, severity levels, and production mode sanitization
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableRemoteLogging: boolean;
  remoteLogUrl?: string;
  includeDataInProduction: boolean;
}

// Determine if we're in production
const isProduction = import.meta.env.PROD === true;

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: isProduction ? LogLevel.INFO : LogLevel.DEBUG,
  enableRemoteLogging: isProduction,
  remoteLogUrl: import.meta.env.VITE_REMOTE_LOG_URL,
  includeDataInProduction: false
};

// In-memory log storage (for debug purposes and local retrieval)
let logHistory: LogEntry[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * Initialize the logger with config options
 */
export const initLogger = (config: Partial<LoggerConfig> = {}) => {
  // Merge with default config
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Optional: Add initialization logic like setting up remote logging connections
  
  // Return the logger instance
  return createLogger(mergedConfig);
};

/**
 * Create a logger instance with the given configuration
 */
const createLogger = (config: LoggerConfig) => {
  /**
   * Log a message with the specified level
   */
  const log = (level: LogLevel, message: string, context?: string, data?: any) => {
    // Skip if below minimum level
    if (!shouldLog(level, config.minLevel)) return;
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      // Don't include data in production unless explicitly enabled
      data: isProduction && !config.includeDataInProduction 
        ? undefined 
        : sanitizeData(data)
    };
    
    // Add to in-memory history
    addToHistory(entry);
    
    // Log to console
    logToConsole(entry);
    
    // Log to remote if enabled
    if (config.enableRemoteLogging && config.remoteLogUrl) {
      logToRemote(entry, config.remoteLogUrl).catch(err => {
        // Log failure to console but don't throw
        console.error('Failed to send log to remote server:', err);
      });
    }
    
    return entry;
  };
  
  return {
    debug: (message: string, context?: string, data?: any) => 
      log(LogLevel.DEBUG, message, context, data),
      
    info: (message: string, context?: string, data?: any) => 
      log(LogLevel.INFO, message, context, data),
      
    warn: (message: string, context?: string, data?: any) => 
      log(LogLevel.WARN, message, context, data),
      
    error: (message: string, context?: string, data?: any) => 
      log(LogLevel.ERROR, message, context, data),
      
    // Create a child logger with pre-filled context
    child: (context: string) => ({
      debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, context, data),
      info: (message: string, data?: any) => log(LogLevel.INFO, message, context, data),
      warn: (message: string, data?: any) => log(LogLevel.WARN, message, context, data),
      error: (message: string, data?: any) => log(LogLevel.ERROR, message, context, data),
    }),
    
    // Get log history
    getHistory: () => [...logHistory],
    
    // Clear log history
    clearHistory: () => {
      logHistory = [];
    }
  };
};

/**
 * Check if a log level should be logged
 */
const shouldLog = (level: LogLevel, minLevel: LogLevel): boolean => {
  const levels = Object.values(LogLevel);
  return levels.indexOf(level) >= levels.indexOf(minLevel);
};

/**
 * Add entry to log history, maintaining max size
 */
const addToHistory = (entry: LogEntry) => {
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY_SIZE) {
    logHistory.shift();
  }
};

/**
 * Log entry to console with appropriate styling
 */
const logToConsole = (entry: LogEntry) => {
  const { level, message, context, data, timestamp } = entry;
  
  // Format timestamp for console
  const time = new Date(timestamp).toLocaleTimeString();
  
  // Base message
  let formattedMessage = `[${time}] ${level.toUpperCase()}`;
  
  // Add context if present
  if (context) {
    formattedMessage += ` [${context}]`;
  }
  
  // Add message
  formattedMessage += `: ${message}`;
  
  // Log with appropriate console method and styling
  switch (level) {
    case LogLevel.DEBUG:
      console.debug('%c' + formattedMessage, 'color: #6c757d', data);
      break;
    case LogLevel.INFO:
      console.info('%c' + formattedMessage, 'color: #0d6efd', data);
      break;
    case LogLevel.WARN:
      console.warn('%c' + formattedMessage, 'color: #ffc107', data);
      break;
    case LogLevel.ERROR:
      console.error('%c' + formattedMessage, 'color: #dc3545', data);
      break;
  }
};

/**
 * Sanitize data to prevent sensitive info logging
 */
const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  // Clone to avoid mutations
  const clone = JSON.parse(JSON.stringify(data));
  
  // List of sensitive keys to redact
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'apiKey', 'api_key', 
    'credentials', 'credit_card', 'creditCard', 'ssn', 'jwt'
  ];
  
  // Function to recursively sanitize objects
  const sanitizeObj = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Check if this is a sensitive key
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        obj[key] = '[REDACTED]';
      } 
      // Recursively sanitize nested objects
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = sanitizeObj(obj[key]);
      }
    });
    
    return obj;
  };
  
  return sanitizeObj(clone);
};

/**
 * Log to remote server
 */
const logToRemote = async (entry: LogEntry, url: string): Promise<void> => {
  try {
    // Don't block on the fetch - we don't want logging to slow down the app
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry),
      // Use a short timeout to avoid blocking
      signal: AbortSignal.timeout(2000)
    }).catch(err => {
      // Silently fail on fetch errors - we don't want to cause cascading errors
      console.debug('Remote logging failed:', err);
    });
  } catch (error) {
    // Silently fail - we don't want logging errors to break the app
    console.debug('Error sending log to remote:', error);
  }
};

// Create a default instance
export const logger = initLogger();

export default logger; 