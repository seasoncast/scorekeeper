type EventHandler = (data: any) => void;

export class CollaborationClient {
  private ws: WebSocket | null = null;
  private userId: string = '';
  private roomId: string = '';
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private serverUrl: string) {}

  async connect(roomId: string): Promise<void> {
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.serverUrl}?roomId=${roomId}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
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
      const handlers = this.eventHandlers.get(event)?.filter(h => h !== handler);
      if (handlers) {
        this.eventHandlers.set(event, handlers);
      }
    }
  }

  sendEdit(editData: any): void {
    this.sendMessage({
      type: 'edit',
      data: editData
    });
  }

  sendCursorPosition(position: { x: number; y: number }): void {
    this.sendMessage({
      type: 'cursor',
      data: position
    });
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        userId: this.userId,
        timestamp: Date.now()
      }));
    }
  }

  private handleMessage(message: any): void {
    const handlers = this.eventHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
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
