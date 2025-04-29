/**
 * Tests for Supabase connection utilities
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  testConnection,
  checkConnectionHealth,
  monitorConnection,
  type ConnectionStatus,
} from "../connection";
import { supabase } from "../config";
import { PostgrestError } from "@supabase/postgrest-js";

// Mock the Supabase client
vi.mock("../config", () => {
  return {
    supabase: {
      rpc: vi.fn(),
    },
  };
});

describe("Supabase connection utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("testConnection", () => {
    it("returns successful status when connection works", async () => {
      // Mock successful connection
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { timestamp: "2023-04-26T12:00:00Z" },
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      });

      // Mock performance.now for consistent testing
      const originalPerformanceNow = performance.now;
      global.performance.now = vi
        .fn()
        .mockReturnValueOnce(100) // Start time
        .mockReturnValueOnce(150); // End time (50ms elapsed)

      // Test the function
      const result = await testConnection();

      // Clean up mock
      global.performance.now = originalPerformanceNow;

      // Assertions
      expect(supabase.rpc).toHaveBeenCalledWith("ping");
      expect(result).toEqual(
        expect.objectContaining({
          isConnected: true,
          latency: 50,
          error: null,
          details: expect.objectContaining({
            serverTimestamp: "2023-04-26T12:00:00Z",
            clientTimestamp: expect.any(String),
          }),
        }),
      );
    });

    it("returns error status when connection fails", async () => {
      // Mock failed connection with correct PostgrestError properties
      const mockError = {
        message: "Connection failed",
        details: "Network error occurred",
        hint: "Check your connection",
        code: "NETWORK_ERROR",
      } as PostgrestError;

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: mockError,
        count: null,
        status: 500,
        statusText: "Internal Server Error",
      });

      // Test the function
      const result = await testConnection();

      // Assertions
      expect(supabase.rpc).toHaveBeenCalledWith("ping");
      expect(result).toEqual(
        expect.objectContaining({
          isConnected: false,
          error: mockError,
        }),
      );
    });
  });

  describe("checkConnectionHealth", () => {
    it("returns true when connection is healthy", async () => {
      // Mock successful connection
      vi.spyOn(global.console, "warn").mockImplementation(() => {});

      // Mock testConnection to return a healthy connection
      vi.mock("../connection", async (importOriginal: () => Promise<any>) => {
        const actual = await importOriginal();
        return {
          ...actual,
          testConnection: vi.fn().mockResolvedValue({
            isConnected: true,
            latency: 150,
            error: null,
            timestamp: new Date(),
          }),
        };
      });

      // Test the function
      const result = await checkConnectionHealth();

      // Assertions
      expect(result).toBe(true);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("monitorConnection", () => {
    it("sets up an interval and calls the callback when status changes", async () => {
      const mockCallback = vi.fn();

      // Mock testConnection to first return connected and then disconnected
      let isFirstCall = true;
      const mockTestConnection = vi.fn().mockImplementation(async () => {
        if (isFirstCall) {
          isFirstCall = false;
          return {
            isConnected: true,
            latency: 100,
            timestamp: new Date(),
          } as ConnectionStatus;
        } else {
          return {
            isConnected: false,
            error: new Error("Lost connection"),
            timestamp: new Date(),
          } as ConnectionStatus;
        }
      });

      vi.mock("../connection", async (importOriginal: () => Promise<any>) => {
        const actual = await importOriginal();
        return {
          ...actual,
          testConnection: mockTestConnection,
        };
      });

      // Start monitoring
      const stopMonitoring = monitorConnection(1000, mockCallback);

      // Fast-forward timers and simulate interval execution
      await vi.advanceTimersByTimeAsync(1000);

      // Validate first call (connected)
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: true,
        }),
      );

      // Reset call history
      mockCallback.mockClear();

      // Fast-forward timers again
      await vi.advanceTimersByTimeAsync(1000);

      // Validate second call (disconnected)
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: false,
          error: expect.any(Error),
        }),
      );

      // Clean up
      stopMonitoring();
    });

    it("returns a function that stops monitoring when called", () => {
      // Mock clearInterval
      const originalClearInterval = global.clearInterval;
      global.clearInterval = vi.fn();

      // Call the function with proper typing for interval ID
      const intervalId = 123 as unknown as NodeJS.Timeout;
      vi.spyOn(global, "setInterval").mockReturnValueOnce(intervalId);

      const stopMonitoring = monitorConnection();

      // Call the stop function
      stopMonitoring();

      // Verify clearInterval was called correctly
      expect(global.clearInterval).toHaveBeenCalledWith(intervalId);

      // Restore original
      global.clearInterval = originalClearInterval;
    });
  });
});
