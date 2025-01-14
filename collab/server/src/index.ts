export interface Env {
  COLLAB_ROOM: DurableObjectNamespace;
}

// Types for collaboration messages
interface UserPresence {
  userId: string;
  cursorPosition?: { x: number; y: number };
}

interface CollaborationMessage {
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'sync';
  userId: string;
  data?: any;
  timestamp: number;
}

// Durable Object for managing collaboration rooms
export class CollaborationRoom {
  private connections: Map<string, WebSocket> = new Map();
  private state: any = {};
  private presence: Map<string, UserPresence> = new Map();

  constructor(private state: DurableObjectState) {}

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
    const userId = crypto.randomUUID();

    // Add new connection
    this.connections.set(userId, ws);
    this.presence.set(userId, { userId });

    // Send initial state and presence
    ws.send(
      JSON.stringify({
        type: 'sync',
        data: {
          state: this.state,
          presence: Array.from(this.presence.values()),
        },
      })
    );

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

        switch (data.type) {
          case 'edit':
            this.state = { ...this.state, ...data.data };
            this.broadcast(data);
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
    const roomId = url.searchParams.get('roomId') || 'default';

    const id = env.COLLAB_ROOM.idFromName(roomId);
    const room = env.COLLAB_ROOM.get(id);

    return room.fetch(request);
  },
};
