export type EventHandler = (data: any) => void;

export class CollaborationClient {
  private ws: WebSocket | null = null;
  private userId = crypto.randomUUID();
  private roomId = '';
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private serverUrl: string) {}

  async connect(roomId: string): Promise<void> {
    this.roomId = roomId;
    console.debug(`[CollabClient] Connecting to room ${roomId} at ${this.serverUrl}`);
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.serverUrl}?roomId=${roomId}&userId=${this.userId}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.debug(`[CollabClient] Connected to room ${roomId}`);
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.debug(`[CollabClient] Received message:`, message);
          this.handleMessage(message);
        } catch (error) {
          console.error('[CollabClient] Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.debug(`[CollabClient] Connection closed, reconnect attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.debug(`[CollabClient] Reconnecting (attempt ${this.reconnectAttempts})...`);
            this.connect(this.roomId);
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      const handlers = this.eventHandlers
        .get(event)
        ?.filter((h) => h !== handler);
      if (handlers) {
        this.eventHandlers.set(event, handlers);
      }
    }
  }

  sendEdit(editData: any): void {
    console.debug(`[CollabClient] Sending edit:`, editData);
    this.sendMessage({
      type: 'edit',
      data: editData,
    });
  }

  sendCursorPosition(position: { x: number; y: number }): void {
    console.debug(`[CollabClient] Sending cursor position:`, position);
    this.sendMessage({
      type: 'cursor',
      data: position,
    });
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        ...message,
        userId: this.userId,
        timestamp: Date.now(),
      };
      console.debug(`[CollabClient] Sending message:`, fullMessage);
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('[CollabClient] Cannot send message - WebSocket not open');
    }
  }

  private handleMessage(message: any): void {
    const handlers = this.eventHandlers.get(message.type) || [];
    handlers.forEach((handler) => handler(message));
  }

  getCurrentUsers(): Promise<UserPresence[]> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.type === 'sync') {
          this.off('sync', handler);
          resolve(message.data.presence);
        }
      };
      this.on('sync', handler);
      this.sendMessage({ type: 'sync' });
    });
  }
}

export interface UserPresence {
  userId: string;
  cursorPosition?: { x: number; y: number };
}
