import { ErrorInfo } from 'react';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ErrorLogEntry {
  id?: string;
  error_id: string;
  component_name?: string;
  error_message: string;
  error_stack?: string;
  component_stack?: string;
  user_id?: string | null;
  browser_info?: string;
  path?: string;
  timestamp: string;
}

/**
 * Centralized utility for logging errors to Supabase and optionally external services
 * @param error The error object
 * @param errorInfo React ErrorInfo object containing component stack
 * @param componentName Optional name of the component where the error occurred
 */
export const logError = async (
  error: Error,
  errorInfo?: ErrorInfo,
  componentName?: string
): Promise<void> => {
  try {
    // Generate unique error ID for tracing
    const errorId = uuidv4();
    
    // Get current user if available
    const { data: userData } = await supabase.auth.getUser();
    let userIdValue: string | undefined = undefined;
    if (userData?.user?.id) {
      userIdValue = userData.user.id;
    }
    
    // Browser and environment info
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };
    
    // Create error log entry
    const errorLogEntry: ErrorLogEntry = {
      error_id: errorId,
      component_name: componentName || 'Unknown',
      error_message: error.message || 'Unknown error',
      error_stack: error.stack,
      component_stack: errorInfo?.componentStack,
      user_id: userIdValue,
      browser_info: JSON.stringify(browserInfo),
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };
    
    // Only log to Supabase in production to avoid filling the table during development
    if (process.env.NODE_ENV === 'production') {
      // Insert into error_logs table
      const { error: insertError } = await supabase
        .from('error_logs')
        .insert(errorLogEntry);
      
      if (insertError) {
        console.error('Failed to insert error log:', insertError);
      }
      
      // Integration with external error tracking services
      // Uncomment if you're using an external service like Sentry
      // sendToExternalService(errorLogEntry);
    }
    
    // Always log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.group(`[ErrorLogger] ${componentName || 'Unknown component'}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo?.componentStack);
      console.error('Error ID:', errorId);
      console.error('User ID:', userIdValue || 'Not logged in');
      console.error('Path:', window.location.pathname);
      console.groupEnd();
    }
  } catch (loggingError) {
    // Fallback logging if error logging itself fails
    console.error('Error in errorLogger:', loggingError);
    console.error('Original error:', error);
  }
};

/**
 * Integrations with external error tracking services
 * Uncomment and customize as needed
 */
/*
const sendToExternalService = (errorLogEntry: ErrorLogEntry) => {
  // Example integration with Sentry
  // Sentry.captureException(new Error(errorLogEntry.error_message), {
  //   tags: {
  //     component: errorLogEntry.component_name,
  //     errorId: errorLogEntry.error_id
  //   },
  //   extra: {
  //     componentStack: errorLogEntry.component_stack,
  //     browserInfo: errorLogEntry.browser_info,
  //     userId: errorLogEntry.user_id
  //   }
  // });
};
*/

export default {
  logError
}; 