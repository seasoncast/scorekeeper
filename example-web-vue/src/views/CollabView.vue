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

    <div class="collab-area" @mousemove="handleMouseMove" ref="collabArea">
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
import { defineComponent } from 'vue';
import { CollaborationClient } from '@sportz/interactive';

export default defineComponent({
  name: 'CollabView',
  data() {
    return {
      roomId: '',
      client: null as CollaborationClient | null,
      otherUsers: [] as Array<{ userId: string; cursorPosition?: { x: number; y: number } }>,
      localCursor: { x: 0, y: 0 },
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

      // Handle cursor updates from other users
      this.client.on('cursor', (message) => {
        const userIndex = this.otherUsers.findIndex(u => u.userId === message.userId);
        if (userIndex === -1) {
          this.otherUsers.push({
            userId: message.userId,
            cursorPosition: message.data
          });
        } else {
          this.otherUsers[userIndex].cursorPosition = message.data;
        }
      });

      // Handle user joins/leaves
      this.client.on('join', (message) => {
        this.otherUsers.push({ userId: message.userId });
      });

      this.client.on('leave', (message) => {
        this.otherUsers = this.otherUsers.filter(u => u.userId !== message.userId);
      });
    },
    handleMouseMove(event: MouseEvent) {
      if (!this.client) return;
      
      const rect = (this.$refs.collabArea as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.localCursor = { x, y };
      this.client.sendCursorPosition({ x, y });
    }
  },
  beforeUnmount() {
    if (this.client) {
      this.client.disconnect();
    }
  }
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
