import { createRouter, createWebHistory } from 'vue-router';
import CollabView from '../views/CollabView.vue';
import HomeView from '../views/ScoreView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/collab',
      name: 'collab',
      component: CollabView,
    },
  ],
});

export default router;
