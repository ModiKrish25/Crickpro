/**
 * WebSocket Manager — Live Match Broadcast
 *
 * Maintains per-match rooms so that every scoring event (run, wicket, extra)
 * is instantly broadcast to all connected devices watching that match.
 *
 * Usage (server):
 *   import { wsManager } from "./websocket";
 *   wsManager.broadcast(matchId, { type: "scoring_event", ... });
 *
 * Frontend connects via:
 *   const ws = useMatchWebSocket(matchId);
 */
import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface MatchRoom {
  /** Set of WebSocket connections subscribed to this match */
  clients: Set<WebSocket>;
}

/**
 * Match state payload sent to all watchers after every delivery.
 */
export interface LiveMatchPayload {
  type: "match_update";
  matchId: string;
  /** Serialised engine MatchState snapshot */
  state: Record<string, unknown>;
  /** Human-readable summary, e.g. "4 runs" or "WICKET! Bowled" */
  summary: string;
  timestamp: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private rooms = new Map<string, MatchRoom>();

  /**
   * Initialise the WebSocket server on top of an existing HTTP server.
   */
  init(server: HttpServer): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      maxPayload: 256 * 1024, // 256 KB
    });

    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress ?? "unknown";
      console.log(`[WS] New connection from ${ip}`);

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          if (msg.type === "subscribe" && msg.matchId) {
            this.joinRoom(msg.matchId as string, ws);
          } else if (msg.type === "unsubscribe" && msg.matchId) {
            this.leaveRoom(msg.matchId as string, ws);
          } else {
            console.warn(`[WS] Unknown message type: ${msg.type}`);
          }
        } catch {
          console.warn("[WS] Failed to parse message");
        }
      });

      ws.on("close", () => {
        // Remove this connection from all rooms
        for (const [matchId, room] of this.rooms) {
          if (room.clients.has(ws)) {
            room.clients.delete(ws);
            if (room.clients.size === 0) {
              this.rooms.delete(matchId);
            }
          }
        }
      });

      ws.on("error", (err) => {
        console.warn(`[WS] Connection error: ${err.message}`);
      });
    });

    console.log("[WS] WebSocket server initialised at /ws");
  }

  /**
   * Subscribe a connection to a match room.
   */
  private joinRoom(matchId: string, ws: WebSocket): void {
    let room = this.rooms.get(matchId);
    if (!room) {
      room = { clients: new Set() };
      this.rooms.set(matchId, room);
    }
    room.clients.add(ws);
    console.log(`[WS] Client joined room "${matchId}" (${room.clients.size} watchers)`);

    // Acknowledge subscription
    ws.send(JSON.stringify({
      type: "subscribed",
      matchId,
      watchers: room.clients.size,
    }));
  }

  /**
   * Unsubscribe a connection from a match room.
   */
  private leaveRoom(matchId: string, ws: WebSocket): void {
    const room = this.rooms.get(matchId);
    if (!room) return;
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      this.rooms.delete(matchId);
    }
  }

  /**
   * Broadcast a payload to all connections watching the given match.
   */
  broadcast(matchId: string, payload: LiveMatchPayload): void {
    const room = this.rooms.get(matchId);
    if (!room || room.clients.size === 0) return;

    const data = JSON.stringify(payload);
    let sent = 0;

    for (const ws of room.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        sent++;
      }
    }

    if (sent > 0) {
      console.log(`[WS] Broadcast to "${matchId}" — ${sent} client(s)`);
    }
  }

  /**
   * Get the number of watchers currently subscribed to a match.
   */
  watcherCount(matchId: string): number {
    return this.rooms.get(matchId)?.clients.size ?? 0;
  }

  /**
   * Gracefully shut down the WebSocket server.
   */
  close(): void {
    this.wss?.close();
    this.rooms.clear();
  }
}

/** Singleton instance */
export const wsManager = new WebSocketManager();
