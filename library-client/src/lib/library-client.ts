import * as fastJsonPatch from 'fast-json-patch';
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
    console.debug(
      `[CollabClient] Connecting to room ${roomId} at ${this.serverUrl}`
    );
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `${this.serverUrl}?roomId=${roomId}&userId=${this.userId}`
      );

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.debug(`[CollabClient] Connected to room ${roomId}`);

        // Send join message
        this.sendMessage({
          type: 'join',
          data: {
            roomId: roomId,
          },
        });

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
        console.debug(
          `[CollabClient] Connection closed, reconnect attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.debug(
              `[CollabClient] Reconnecting (attempt ${this.reconnectAttempts})...`
            );
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

  onUpdate(callback: (newDocument: any, timelineEntry?: any) => void): void {
    // Handle both edit and sync messages
    this.on('edit', (message) => {
      if (Array.isArray(message.data)) {
        const result = fastJsonPatch.applyPatch(
          this.currentDocumentState,
          message.data,
          false,
          false
        );
        const timelineEntry = {
          diff: message.data,
          meta: message.meta,
          timestamp: message.timestamp,
          editId: message.editId
        };
        this.timeline.push(timelineEntry);
        callback(result.newDocument, timelineEntry);
      }
    });
    
    this.on('sync', (message) => {
      if (message.data?.state) {
        callback(message.data.state);
      }
    });
  }

  private currentDocumentState: any = {};
  private startingDocumentState: any = {};
  private timeline: Array<any> = [];

  pushTimeline(diff?: any[], meta?: Record<string, any>): void {
    if (diff && diff.length > 0) {
      const timelineEntry = {
        diff,
        meta,
        timestamp: Date.now(),
        editId: crypto.randomUUID()
      };
      console.debug(`[CollabClient] Pushing timeline entry:`, timelineEntry);
      this.timeline.push(timelineEntry);
      this.currentDocumentState = fastJsonPatch.applyPatch(
        this.currentDocumentState,
        diff,
        false,
        false
      ).newDocument;
    }
    this.sendMessage({
      type: 'update',
      data: {
        diff,
        meta,
      },
    });
  }

  sendEdit(newState: any, meta?: Record<string, any>): void {
    const diff = fastJsonPatch.compare(this.currentDocumentState, newState);
    this.pushTimeline(diff, meta);
  }

  getDocumentState(): any {
    return this.currentDocumentState;
  }

  getTimeline(request: TimelineRequest): Promise<TimelineResponse> {
    // Sort timeline entries by timestamp
    const sortedTimeline = this.timeline.sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the requested count of entries
    const entries = request.order === 'latest' 
      ? sortedTimeline.slice(-request.count)
      : sortedTimeline.slice(0, request.count);

    return Promise.resolve({
      type: 'timeline',
      data: {
        edits: entries
      }
    });
  }

  resetDocumentState(newState: any): void {
    this.startingDocumentState = newState;
    this.currentDocumentState = newState;
    this.diffTimeline = [];
  }

  private lastCursorUpdate = 0;
  private cursorThrottleMs = 100;

  sendCursorPosition(position: { x: number; y: number }): void {
    const now = Date.now();
    if (now - this.lastCursorUpdate >= this.cursorThrottleMs) {
      console.debug(`[CollabClient] Sending cursor position:`, position);
      this.sendMessage({
        type: 'cursor',
        data: position,
      });
      this.lastCursorUpdate = now;
    }
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
    handlers.forEach((handler) => {
      if (message.type === 'edit' && Array.isArray(message.data)) {
        const result = fastJsonPatch.applyPatch(
          this.currentDocumentState,
          message.data,
          false,
          false
        );
        this.currentDocumentState = result.newDocument;
        this.diffTimeline.push(message.data);
      } else if (message.type === 'sync' && message.data?.state) {
        console.debug(
          `[CollabClient] Syncing document state:`,
          message.data.state
        );
        this.currentDocumentState = message.data.state;
      }
      handler(message);
    });
  }

  getTimeline(request: TimelineRequest): Promise<TimelineResponse> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.type === 'timeline') {
          this.off('timeline', handler);
          resolve(message);
        }
      };
      this.on('timeline', handler);
      this.sendMessage({
        type: 'timeline',
        data: request,
      });
    });
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

export interface CursorPosition {
  x: number;
  y: number;
}

export interface UserPresence {
  userId: string;
  cursorPosition?: CursorPosition;
  lastActive?: number;
}

export interface SyncMessage {
  type: 'sync';
  data: {
    state: any;
    presence: UserPresence[];
  };
}

export interface TimelineRequest {
  order: 'latest' | 'first';
  count: number;
}

export interface TimelineResponse {
  type: 'timeline';
  data: {
    edits: Edit[];
  };
}

export interface Edit {
  editId: string;
  userId: string;
  timestamp: number;
  patch: any[];
}
