<script setup lang="ts">
import { Basketball, Player, SportEvent, Team } from '@org/core-library';
import { onMounted, reactive, ref } from 'vue';
const score = ref(0);
const Team1 = new Team('Team 1');
Team1.addPlayer(new Player('Player 1'));
const Team2 = new Team('Team 2');
const sportEvent = new SportEvent();
sportEvent.addTeam(Team1);
sportEvent.addTeam(Team2);

const editorBasketball = new Basketball(sportEvent);

const addScore = (team: Team, score: number) => {
  state.editor.addScore(team, score);
};

const missedFG = () => {
  state.editor.shotMissed({
    teamShooting: Team1.id,
    teamDefending: Team2.id,
  });
};

const undoScore = () => {
  state.sportEvent.undoLastTimelineEvent();
};

const state = reactive({
  editor: editorBasketball,
  sportEvent,
  addScore,
});

//  draw on shotTracker canvas a image of a basketball court
const drawCourt = () => {
  const canvas = document.getElementById('shotTracker') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = '/assets/basketball.jpeg';
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawShotsOnCourt();
  };
};

// on mounted draw the court
onMounted(() => {
  drawCourt();
});

// get x and y coordinates of the click on the canvas by percentage
const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
    y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
  };
};

// place a shot on the canvas
const placeShot = (evt: MouseEvent) => {
  const canvas = document.getElementById('shotTracker') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  const pos = getMousePos(canvas, evt);

  const xPercent = pos.x / canvas.width;
  const yPercent = pos.y / canvas.height;
  state.editor.shotMissed({
    teamShooting: Team1.id,
    teamDefending: Team2.id,
    position: [xPercent, yPercent],
  });
  drawCourt();
};
const drawShotsOnCourt = () => {
  const canvas = document.getElementById('shotTracker') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  const shots = state.sportEvent.sport_data.stats.team_data[0].shot_position;
  if (!shots) return;
  for (let i = 0; i < shots.length; i++) {
    const x = shots[i][0] * canvas.width;
    const y = shots[i][1] * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();
  }
};
</script>

<template>
  <main>
    <h1>Score View</h1>
    <canvas
      id="shotTracker"
      v-bind="{ width: 400 * 1.8666937614, height: 400 }"
      @click="placeShot"
      ref="shotTracker"
    ></canvas>
    <p>All Event Data {{ state.sportEvent.sport_data }}</p>
    <div
      v-for="team in state.sportEvent.sport_data.stats.team_data"
      :key="team.id"
    >
      <p>{{ team.name }}: {{ team.score }}</p>
      <button @click="addScore(Team1, 1)">Increment</button>
      <button @click="missedFG()">Missed FG</button>
    </div>

    <button @click="undoScore">Undo Last Timeline</button>
  </main>
</template>
