/**
 * useMatchWebSocket — Subscribe to live match updates via WebSocket
 *
 * Connects to the server's WebSocket endpoint and subscribes to a specific
 * match room. Provides real-time match state updates to all connected watchers.
 *
 * Usage:
 *   const { connected, lastUpdate } = useMatchWebSocket("123");
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import type { LiveMatchPayload } from "@/server/core/websocket";

export interface MatchWebSocketState {
  /** Whether the WebSocket connection is established */
  connected: boolean;
  /** The most recent match update received */
  lastUpdate: LiveMatchPayload | null;
  /** Error message if connection failed */
  error: string | null;
  /** Number of watchers in the match room */
  watchers: number;
}

/**
 * Hook to subscribe to live match updates via WebSocket.
 *
 * @param matchId — The DB match ID to subscribe to. Pass null/undefined to skip.
 */
export function useMatchWebSocket(matchId: string | null | undefined): MatchWebSocketState & { reconnect: () => void } {
  const [state, setState] = useState<MatchWebSocketState>({
    connected: false,
    lastUpdate: null,
    error: null,
    watchers: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Derive the WebSocket URL from the API base URL
  const getWsUrl = useCallback((): string | null => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return null;
    // Replace http/https with ws/wss
    const wsBase = baseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${wsBase}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (!matchId) return;

    const wsUrl = getWsUrl();
    if (!wsUrl) {
      setState(prev => ({ ...prev, error: "No WebSocket URL available" }));
      return;
    }

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, connected: true, error: null }));
        // Subscribe to the match room
        ws.send(JSON.stringify({ type: "subscribe", matchId }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === "subscribed") {
            // Acknowledge from server
            setState(prev => ({ ...prev, watchers: data.watchers || 0 }));
          } else if (data.type === "match_update") {
            setState(prev => ({
              ...prev,
              lastUpdate: data as LiveMatchPayload,
              watchers: data.watchers || prev.watchers,
            }));
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, error: "WebSocket connection error" }));
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setState(prev => ({ ...prev, connected: false }));
        // Auto-reconnect after 3 seconds
        if (matchId) {
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create WebSocket";
      setState(prev => ({ ...prev, error: message }));
    }
  }, [matchId, getWsUrl]);

  // Connect when matchId changes
  useEffect(() => {
    mountedRef.current = true;
    if (matchId) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [matchId, connect]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return { ...state, reconnect };
}
