import { supabase } from '../../services/supabase';

export class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  
  startRefreshCycle(intervalMs = 4 * 60 * 1000) { // 4 minutes for refresh check
    this.stopRefreshCycle();
    this.refreshTimer = setInterval(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.error('Session refresh failed:', error);
        this.stopRefreshCycle();
        // TODO: Trigger logout or display refresh error
        // Consider posting a message to the authChannel if implemented
      }
    }, intervalMs);
  }
  
  stopRefreshCycle() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  getExpiryTime(token: string): Date | null {
    try {
      // Extract expiry from JWT (payload is second part)
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );
      return new Date(payload.exp * 1000);
    } catch (e) {
      console.error('Failed to parse token expiry', e);
      return null;
    }
  }
} 