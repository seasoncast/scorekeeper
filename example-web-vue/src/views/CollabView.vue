<template>
  <div class="collab-view">
    <div class="timeline">
      <h3>Recent Edits</h3>
      <ul>
        <li v-for="edit in timeline" :key="edit.editId" class="timeline-item">
          <div class="timeline-user">{{ edit.userId.slice(0, 2) }}</div>
          <div class="timeline-details">
            <div class="timeline-time">
              {{ new Date(edit.timestamp).toLocaleTimeString() }}
            </div>
            <div class="timeline-patch">{{ edit.patch.length }} changes</div>
          </div>
        </li>
      </ul>
    </div>

    <div class="controls">
      <input
        v-model="roomId"
        placeholder="Enter Room ID"
        @keyup.enter="connectToRoom"
      />
      <button @click="connectToRoom">Join Room</button>
    </div>

    <div class="collab-area" ref="collabArea">
      <textarea
        v-model="document.text"
        @input="handleTextChange"
        class="document-editor"
      />
      <div
        v-for="user in otherUsers"
        :key="user.userId"
        class="cursor"
        :style="{
          left: `${user.cursorPosition?.x}px`,
          top: `${user.cursorPosition?.y}px`,
        }"
      >
        {{ user.userId.slice(0, 2) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { CollaborationClient } from '@org/client-library';
import * as fastJsonPatch from 'fast-json-patch';
import { SyncMessage } from 'library-client/src/lib/library-client';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CollabView',
  data() {
    return {
      roomId: '',
      client: null as CollaborationClient | null,
      otherUsers: [] as Array<{
        userId: string;
        cursorPosition?: { x: number; y: number };
      }>,
      document: {
        text: '',
      },
      timeline: [] as Edit[],
    };
  },
  methods: {
    async loadTimeline() {
      if (!this.client) return;
      const response = await this.client.getTimeline({
        order: 'latest',
        count: 5,
      });
      this.timeline = response.data.edits;
    },

    async connectToRoom() {
      if (!this.roomId) return;

      if (this.client) {
        this.client.disconnect();
      }

      this.client = new CollaborationClient('localhost:8787');
      await this.client.connect(this.roomId);

      // Handle initial sync with all users and their cursor positions
      this.client.on('sync', (message: SyncMessage) => {
        this.document = message.data.state;
        this.otherUsers = message.data.presence.filter(
          (user) => user.userId !== this.client?.userId
        );
      });

      // Handle document edits
      this.client.on('edit', (message) => {
        if (Array.isArray(message.data)) {
          const newDoc = fastJsonPatch.applyPatch(
            this.document,
            message.data,
            false,
            false
          ).newDocument;
          console.log('newDoc', newDoc);
          this.document = newDoc;
        }
      });

      // Handle cursor updates from other users
      this.client.on('cursor', (message) => {
        const userIndex = this.otherUsers.findIndex(
          (u) => u.userId === message.userId
        );
        if (userIndex === -1) {
          this.otherUsers.push({
            userId: message.userId,
            cursorPosition: message.data,
            lastActive: Date.now(),
          });
        } else {
          this.otherUsers[userIndex].cursorPosition = message.data;
          this.otherUsers[userIndex].lastActive = Date.now();
        }
      });

      // Handle user joins/leaves
      this.client.on('join', (message) => {
        this.otherUsers.push({ userId: message.userId });
      });

      this.client.on('leave', (message) => {
        this.otherUsers = this.otherUsers.filter(
          (u) => u.userId !== message.userId
        );
      });

      // Load timeline
      this.loadTimeline();
    },
    handleTextChange(event: InputEvent) {
      if (!this.client) return;

      const newText = event.target.value;
      this.document.text = newText;
      this.client.sendEdit(this.document);

      // Refresh timeline after edit
      this.loadTimeline();
    },
  },
  beforeUnmount() {
    if (this.client) {
      this.client.disconnect();
    }
  },
});
</script>

<style scoped>
.timeline {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
}

.timeline h3 {
  margin: 0 0 1rem 0;
}

.timeline-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.timeline-user {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 0.5rem;
}

.timeline-details {
  flex: 1;
}

.timeline-time {
  font-size: 0.8rem;
  color: #666;
}

.timeline-patch {
  font-size: 0.9rem;
}

.collab-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.controls {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.collab-area {
  flex: 1;
  position: relative;
  background: white;
  overflow: hidden;
  padding: 1rem;
}

.document-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  padding: 1rem;
}

.cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 255, 0.2);
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  font-weight: bold;
}
</style>
