import { renderHook, act } from "@testing-library/react-hooks";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useConnectionMonitoring } from "../useConnectionMonitoring";
import {
  testConnection,
  monitorConnection,
} from "../../services/supabase/connection";

// Mock the connection testing functions
vi.mock("../../services/supabase/connection", () => ({
  testConnection: vi.fn(),
  monitorConnection: vi.fn(),
}));

// Mock the window online/offline events
const mockOnlineState = (online: boolean) => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
};

// Helper to trigger online/offline events
const triggerConnectionEvent = (type: "online" | "offline") => {
  window.dispatchEvent(new Event(type));
};

describe("useConnectionMonitoring", () => {
  // Setup before tests
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock for testConnection
    vi.mocked(testConnection).mockResolvedValue({
      isConnected: true,
      latency: 100,
      timestamp: new Date(),
      error: null,
    });

    // Default mock for monitorConnection
    vi.mocked(monitorConnection).mockReturnValue(() => {});

    // Default online state
    mockOnlineState(true);
  });

  // Clean up after tests
  afterEach(() => {
    // Restore mocks
    vi.resetAllMocks();
  });

  it("should initialize with online status and check connection", async () => {
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useConnectionMonitoring(),
    );

    // Wait for the initial connection check
    await waitForNextUpdate();

    // Assert initial state
    expect(result.current.isOnline).toBe(true);
    expect(testConnection).toHaveBeenCalledTimes(1);
  });

  it("should update status when connection check completes", async () => {
    // Mock connection test result
    vi.mocked(testConnection).mockResolvedValueOnce({
      isConnected: true,
      latency: 250,
      timestamp: new Date(),
      error: null,
    });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useConnectionMonitoring(),
    );

    // Wait for the initial connection check
    await waitForNextUpdate();

    // Assert state after connection check
    expect(result.current.isConnected).toBe(true);
    expect(result.current.latency).toBe(250);
    expect(result.current.connectionStatus).toEqual(
      expect.objectContaining({
        isConnected: true,
        latency: 250,
      }),
    );
  });

  it("should respond to browser online/offline events", async () => {
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useConnectionMonitoring(),
    );

    // Wait for initial connection check
    await waitForNextUpdate();

    // Verify initial state
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      mockOnlineState(false);
      triggerConnectionEvent("offline");
    });

    // Check that state was updated
    expect(result.current.isOnline).toBe(false);

    // Simulate coming back online
    act(() => {
      mockOnlineState(true);
      triggerConnectionEvent("online");
    });

    // Check that state was updated and a connection check was triggered
    expect(result.current.isOnline).toBe(true);
    expect(testConnection).toHaveBeenCalledTimes(2); // Initial + after coming online
  });

  it("should set up connection monitoring with the specified interval", () => {
    // Render the hook with custom interval
    renderHook(() => useConnectionMonitoring({ checkInterval: 30000 }));

    // Check that monitoring was set up with the right interval
    expect(monitorConnection).toHaveBeenCalledWith(30000, expect.any(Function));
  });

  it("should not set up monitoring when enableMonitoring is false", () => {
    // Render the hook with monitoring disabled
    renderHook(() => useConnectionMonitoring({ enableMonitoring: false }));

    // Initial connection check should still happen
    expect(testConnection).toHaveBeenCalledTimes(1);

    // But monitoring should not be set up
    expect(monitorConnection).not.toHaveBeenCalled();
  });

  it("should call onStatusChange when connection status changes", async () => {
    // Set up mock
    const onStatusChange = vi.fn();

    // Render hook with callback
    const { waitForNextUpdate } = renderHook(() =>
      useConnectionMonitoring({ onStatusChange }),
    );

    // Wait for initial connection check
    await waitForNextUpdate();

    // Check callback was called
    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isConnected: true,
      }),
    );
  });

  it("should expose a checkConnection function that works", async () => {
    // Set up mock for the manual check
    vi.mocked(testConnection)
      .mockResolvedValueOnce({
        isConnected: true,
        latency: 100,
        timestamp: new Date(),
        error: null,
      })
      .mockResolvedValueOnce({
        isConnected: false,
        latency: 500,
        timestamp: new Date(),
        error: new Error("Connection failed"),
      });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useConnectionMonitoring(),
    );

    // Wait for the initial connection check
    await waitForNextUpdate();

    // Perform manual check
    let status;
    await act(async () => {
      status = await result.current.checkConnection();
    });

    // Assert results of manual check
    expect(status).toEqual(
      expect.objectContaining({
        isConnected: false,
        error: expect.any(Error),
      }),
    );

    // State should be updated
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionStatus?.error).toEqual(expect.any(Error));
  });
});
