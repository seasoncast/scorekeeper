<template>
  <div class="collab-view">
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
        v-model="documentText"
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
    };
  },
  methods: {
    async connectToRoom() {
      if (!this.roomId) return;

      if (this.client) {
        this.client.disconnect();
      }

      this.client = new CollaborationClient('ws://localhost:8787');
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
          this.document.text = fastJsonPatch.applyPatch(
            this.document.text,
            message.data,
            false,
            false
          ).newDocument;
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
    },
    handleTextChange(event: InputEvent) {
      if (!this.client) return;

      const newText = event.target.value;
      this.client.sendEdit(newText);
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
