import { vi } from 'vitest';

// Basic mock data types that mimic Supabase response structures
type MockResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Helper to create successful response
const successResponse = <T>(data: T): MockResponse<T> => ({
  data,
  error: null,
});

// Helper to create error response
const errorResponse = <T>(message: string | null): MockResponse<T> => ({
  data: null,
  error: message ? new Error(message) : null,
});

// Mock data store for in-memory testing
const mockDataStore = {
  users: new Map<string, any>(),
  products: new Map<string, any>(),
  auction_slots: new Map<string, any>(),
  conversations: new Map<string, any>(),
  messages: new Map<string, any>(),
  
  // Helper to reset all data (useful between tests)
  reset() {
    this.users.clear();
    this.products.clear();
    this.auction_slots.clear();
    this.conversations.clear();
    this.messages.clear();
  },
  
  // Seed with initial test data
  seed(data: { [table: string]: any[] }) {
    Object.entries(data).forEach(([table, items]) => {
      const tableMap = this[table as keyof typeof mockDataStore] as Map<string, any>;
      if (tableMap) {
        items.forEach(item => {
          tableMap.set(item.id, item);
        });
      }
    });
  }
};

// Create a mock Supabase client with common functions
export const createMockSupabaseClient = () => {
  // Common query builder that works with the mock data store
  const createQueryBuilder = (table: keyof typeof mockDataStore) => {
    const tableData = mockDataStore[table] as Map<string, any>;
    let filters: Array<(item: any) => boolean> = [];
    let selectedFields: string[] | null = null;
    let orderByField: string | null = null;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let limitCount: number | null = null;
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;
    
    const queryBuilder = {
      select: (fields: string) => {
        selectedFields = fields === '*' ? null : fields.split(',').map(f => f.trim());
        return queryBuilder;
      },
      
      eq: (field: string, value: any) => {
        filters.push((item) => item[field] === value);
        return queryBuilder;
      },
      
      neq: (field: string, value: any) => {
        filters.push((item) => item[field] !== value);
        return queryBuilder;
      },
      
      gt: (field: string, value: any) => {
        filters.push((item) => item[field] > value);
        return queryBuilder;
      },
      
      gte: (field: string, value: any) => {
        filters.push((item) => item[field] >= value);
        return queryBuilder;
      },
      
      lt: (field: string, value: any) => {
        filters.push((item) => item[field] < value);
        return queryBuilder;
      },
      
      lte: (field: string, value: any) => {
        filters.push((item) => item[field] <= value);
        return queryBuilder;
      },
      
      like: (field: string, pattern: string) => {
        const regexPattern = pattern.replace(/%/g, '.*');
        const regex = new RegExp(regexPattern, 'i');
        filters.push((item) => regex.test(item[field]));
        return queryBuilder;
      },
      
      in: (field: string, values: any[]) => {
        filters.push((item) => values.includes(item[field]));
        return queryBuilder;
      },
      
      is: (field: string, value: any) => {
        if (value === null) {
          filters.push((item) => item[field] === null);
        } else {
          filters.push((item) => item[field] === value);
        }
        return queryBuilder;
      },
      
      order: (field: string, options: { ascending?: boolean }) => {
        orderByField = field;
        orderDirection = options?.ascending === false ? 'desc' : 'asc';
        return queryBuilder;
      },
      
      limit: (count: number) => {
        limitCount = count;
        return queryBuilder;
      },
      
      range: (start: number, end: number) => {
        rangeStart = start;
        rangeEnd = end;
        return queryBuilder;
      },
      
      single: async () => {
        try {
          const items = Array.from(tableData.values());
          const filteredItems = filters.length > 0
            ? items.filter(item => filters.every(filter => filter(item)))
            : items;
            
          if (filteredItems.length === 0) {
            return errorResponse<any>(`No records found in ${table}`);
          }
          
          if (filteredItems.length > 1) {
            return errorResponse<any>(`More than one record found in ${table}`);
          }
          
          let result = filteredItems[0];
          
          // Apply field selection if specified
          if (selectedFields) {
            const selectedObj: any = {};
            selectedFields.forEach(field => {
              selectedObj[field] = result[field];
            });
            result = selectedObj;
          }
          
          return successResponse(result);
        } catch (error) {
          return errorResponse<any>(error instanceof Error ? error.message : 'Unknown error');
        }
      },
      
      execute: async () => {
        try {
          let items = Array.from(tableData.values());
          
          // Apply filters
          const filteredItems = filters.length > 0
            ? items.filter(item => filters.every(filter => filter(item)))
            : items;
          
          // Apply ordering
          if (orderByField !== null) {
            const field = orderByField; // Use a non-null variable
            filteredItems.sort((a: any, b: any) => {
              if (orderDirection === 'asc') {
                return a[field] < b[field] ? -1 : 1;
              } else {
                return a[field] > b[field] ? -1 : 1;
              }
            });
          }
          
          // Apply range/pagination
          let resultItems = filteredItems;
          if (rangeStart !== null && rangeEnd !== null) {
            resultItems = filteredItems.slice(rangeStart, rangeEnd + 1);
          } else if (limitCount !== null) {
            resultItems = filteredItems.slice(0, limitCount);
          }
          
          // Apply field selection if specified
          if (selectedFields) {
            resultItems = resultItems.map(item => {
              const selectedObj: any = {};
              selectedFields!.forEach(field => {
                selectedObj[field] = item[field];
              });
              return selectedObj;
            });
          }
          
          return successResponse(resultItems);
        } catch (error) {
          return errorResponse<any[]>(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };
    
    return queryBuilder;
  };
  
  // Mock Supabase client
  return {
    from: (table: string) => createQueryBuilder(table as keyof typeof mockDataStore),
    
    auth: {
      signUp: vi.fn().mockImplementation(async ({ email, password }) => {
        // Basic validation
        if (!email || !password) {
          return errorResponse<any>('Email and password are required');
        }
        
        // Check if user already exists
        const existingUsers = Array.from(mockDataStore.users.values());
        const userExists = existingUsers.some(user => user.email === email);
        
        if (userExists) {
          return errorResponse<any>('User already exists');
        }
        
        // Create new user
        const newUser = {
          id: `user_${Date.now()}`,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        mockDataStore.users.set(newUser.id, newUser);
        
        return successResponse({
          user: newUser,
          session: {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          }
        });
      }),
      
      signIn: vi.fn().mockImplementation(async ({ email, password }) => {
        // Basic validation
        if (!email || !password) {
          return errorResponse<any>('Email and password are required');
        }
        
        // Find user
        const users = Array.from(mockDataStore.users.values());
        const user = users.find(u => u.email === email);
        
        if (!user) {
          return errorResponse<any>('Invalid login credentials');
        }
        
        return successResponse({
          user,
          session: {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          }
        });
      }),
      
      signOut: vi.fn().mockImplementation(async () => {
        return successResponse({});
      }),
      
      getUser: vi.fn().mockImplementation(async () => {
        const users = Array.from(mockDataStore.users.values());
        return successResponse({ user: users[0] || null });
      }),
    },
    
    storage: {
      from: (bucket: string) => ({
        upload: vi.fn().mockImplementation(async (path: string, file: any) => {
          return successResponse({ path });
        }),
        getPublicUrl: vi.fn().mockImplementation((path: string) => {
          return { data: { publicUrl: `https://mock-storage.com/${path}` } };
        }),
        remove: vi.fn().mockImplementation(async (paths: string[]) => {
          return successResponse({});
        }),
      }),
    },
    
    // Helper to reset all mock data (useful between tests)
    _reset: () => {
      mockDataStore.reset();
    },
    
    // Helper to seed mock data
    _seed: (data: { [table: string]: any[] }) => {
      mockDataStore.seed(data);
    }
  };
};

// Export helpers for direct usage
export const mockSupabase = createMockSupabaseClient();
export const resetMockData = () => mockDataStore.reset();
export const seedMockData = (data: { [table: string]: any[] }) => mockDataStore.seed(data);