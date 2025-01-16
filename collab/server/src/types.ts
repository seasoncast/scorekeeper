export interface Env {
  COLLAB_ROOM: DurableObjectNamespace;
}

export interface UserPresence {
  userId: string;
  cursorPosition?: { x: number; y: number };
}

export interface CollaborationMessage {
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'sync' | 'timeline';
  userId: string;
  data?: any;
  timestamp: number;
  editId?: string;
}

export interface TimelineRequest {
  order: 'latest' | 'first';
  count: number;
}

export interface TimelineResponse {
  edits: Edit[];
}

export interface Edit {
  editId: string;
  userId: string;
  timestamp: number;
  patch: any[];
  meta?: Record<string, any>;
}

export interface SyncMessage extends CollaborationMessage {
  type: 'sync';
  data: {
    state: any;
    presence: UserPresence[];
  };
}
