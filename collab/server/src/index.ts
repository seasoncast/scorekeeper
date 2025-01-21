import * as fastJsonPatch from 'fast-json-patch';
import { AuthService } from './auth';
import {
  CollaborationMessage,
  Edit,
  Env,
  SyncMessage,
  TimelineRequest,
  UserPresence,
} from './types';

// Durable Object for managing collaboration rooms
export class CollaborationRoom {
  private connections: Map<string, WebSocket> = new Map();
  private currentDocumentState: any = {};
  private presence: Map<string, UserPresence> = new Map();
  private timelineKey: string;

  constructor(private state: DurableObjectState) {
    // Initialize state from storage
    this.state.blockConcurrencyWhile(async () => {
      // Get roomId from storage name
      const roomId = this.state.id.toString();
      this.timelineKey = `${roomId}-timeline`;

      // Load document state
      const storedState = await this.state.storage.get<any>('documentState');
      this.currentDocumentState = storedState || undefined;
    });
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    await this.handleWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleWebSocket(ws: WebSocket) {
    ws.accept();

    let userId: string | null = null;
    let token: string | null = null;

    // Send initial state and presence with cursor positions
    const presenceWithCursors = Array.from(this.presence.values()).map(
      (user) => ({
        userId: user.userId,
        cursorPosition: user.cursorPosition,
        lastActive: Date.now(),
      })
    );

    const syncMessage: SyncMessage = {
      type: 'sync',
      userId,
      timestamp: Date.now(),
      data: {
        state: this.currentDocumentState,
        presence: presenceWithCursors,
      },
    };
    ws.send(JSON.stringify(syncMessage));

    // Broadcast join
    this.broadcast({
      type: 'join',
      userId,
      timestamp: Date.now(),
    });

    // Handle messages
    ws.addEventListener('message', async (msg) => {
      try {
        const data: CollaborationMessage = JSON.parse(msg.data);

        // Verify token on every message
        if (!data.token) {
          ws.close(4001, 'Token required');
          return;
        }

        const payload = AuthService.verifyToken(data.token);
        if (!payload) {
          ws.close(4002, 'Invalid token');
          return;
        }

        // First message sets up the user
        if (!userId) {
          userId = payload.userId;
          token = data.token;
          this.connections.set(userId, ws);
          this.presence.set(userId, { userId });

          // Send initial state and presence with cursor positions
          const presenceWithCursors = Array.from(this.presence.values()).map(
            (user) => ({
              userId: user.userId,
              cursorPosition: user.cursorPosition,
              lastActive: Date.now(),
            })
          );

          const syncMessage: SyncMessage = {
            type: 'sync',
            timestamp: Date.now(),
            data: {
              state: this.currentDocumentState,
              presence: presenceWithCursors,
            },
          };
          ws.send(JSON.stringify(syncMessage));

          // Broadcast join
          this.broadcast({
            type: 'join',
            userId,
            timestamp: Date.now(),
          });
        }

        // Verify token matches established user
        if (userId !== payload.userId) {
          ws.close(4003, 'Token user mismatch');
          return;
        }

        switch (data.type) {
          case 'update':
            if (data.data && Array.isArray(data.data.diff)) {
              const { diff, meta } = data.data;
              // Generate unique edit ID
              const editId = crypto.randomUUID();

              // Store the edit with optional meta
              await this.state.storage.put(`${this.timelineKey}-${editId}`, {
                editId,
                userId,
                timestamp: Date.now(),
                patch: diff,
                meta,
              });

              // Add to timeline
              const timeline =
                (await this.state.storage.get<string[]>(this.timelineKey)) ||
                [];
              timeline.push(editId);
              await this.state.storage.put(this.timelineKey, timeline);

              // Apply patch
              const newState = fastJsonPatch.applyPatch(
                this.currentDocumentState || {},
                diff,
                false,
                false
              ).newDocument;

              // Persist the new state
              await this.state.storage.put('documentState', newState);
              this.currentDocumentState = newState;
              console.log('Updated document state:', newState);
              // Broadcast update with editId
              this.broadcast({
                type: 'update',
                userId,
                timestamp: Date.now(),
                editId,
                data: {
                  diff,
                  meta,
                },
              });
            }
            break;

          case 'timeline':
            if (data.data) {
              const { order, count } = data.data as TimelineRequest;
              const timeline =
                (await this.state.storage.get<string[]>(this.timelineKey)) ||
                [];

              // Get the requested edit IDs
              const editIds =
                order === 'latest'
                  ? timeline.slice(-count)
                  : timeline.slice(0, count);

              // Fetch the edit objects
              const edits = await Promise.all(
                editIds.map((id) =>
                  this.state.storage.get<Edit>(`${this.timelineKey}-${id}`)
                )
              );

              // Send response
              ws.send(
                JSON.stringify({
                  type: 'timeline',
                  userId,
                  timestamp: Date.now(),
                  data: {
                    edits: edits.filter(Boolean) as Edit[],
                  },
                })
              );
            }
            break;

          case 'cursor':
            const presence = this.presence.get(data.userId);
            if (presence) {
              presence.cursorPosition = data.data;
              this.broadcast(data);
            }
            break;
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    // Handle close
    ws.addEventListener('close', () => {
      this.connections.delete(userId);
      this.presence.delete(userId);
      this.broadcast({
        type: 'leave',
        userId,
        timestamp: Date.now(),
      });
    });
  }

  broadcast(message: CollaborationMessage) {
    const payload = JSON.stringify(message);
    this.connections.forEach((ws) => {
      try {
        ws.send(payload);
      } catch (err) {
        console.error('Error broadcasting message:', err);
      }
    });
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/user/login/anonymous') {
      const userId = crypto.randomUUID();
      const token = await AuthService.generateToken(userId);
      return new Response(JSON.stringify({ token }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const roomId = url.searchParams.get('roomId') || 'default';
    const id = env.COLLAB_ROOM.idFromName(roomId);
    const room = env.COLLAB_ROOM.get(id);

    return room.fetch(request);
  },
};
