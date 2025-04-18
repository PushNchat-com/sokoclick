import { useState, useEffect } from 'react';
import { supabaseClient } from '../api/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type UserRecord = {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  [key: string]: any;
};

/**
 * Hook for subscribing to real-time user updates
 * This allows admin dashboards to see user changes immediately
 */
export const useRealtimeUsers = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let subscription: RealtimeChannel;
    
    const fetchInitialUsers = async () => {
      setLoading(true);
      
      try {
        // Fetch initial users
        const { data: initialUsers, error: fetchError } = await supabaseClient
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (fetchError) throw fetchError;
        
        setUsers(initialUsers || []);
      } catch (err) {
        console.error('Error fetching initial users:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch users'));
      } finally {
        setLoading(false);
      }
    };
    
    const setupSubscription = async () => {
      // Enable realtime for the users table
      await supabaseClient.channel('schema-db-changes').on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('Realtime users update:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Update local state based on event type
          if (eventType === 'INSERT') {
            setUsers(prev => [newRecord as UserRecord, ...prev]);
          } else if (eventType === 'UPDATE') {
            setUsers(prev => 
              prev.map(user => 
                user.id === (newRecord as UserRecord).id 
                  ? { ...user, ...(newRecord as UserRecord) } 
                  : user
              )
            );
          } else if (eventType === 'DELETE') {
            setUsers(prev => 
              prev.filter(user => user.id !== (oldRecord as UserRecord).id)
            );
          }
        }
      ).subscribe();
    };
    
    // Fetch initial data and set up subscription
    fetchInitialUsers()
      .then(setupSubscription)
      .catch(err => {
        console.error('Error setting up realtime subscription:', err);
        setError(err instanceof Error ? err : new Error('Failed to setup realtime'));
      });
    
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabaseClient.removeChannel(subscription);
      }
    };
  }, []);
  
  return { users, loading, error };
};

export default useRealtimeUsers; 