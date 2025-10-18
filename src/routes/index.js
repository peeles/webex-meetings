import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../storage/auth';
import HomePage from '../views/HomeScreen.vue';
import MeetingPage from '../views/MeetingScreen.vue';

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage
    },
    {
        path: '/meeting/:id',
        name: 'meeting',
        component: MeetingPage,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isRegistered) {
        next({ name: 'home' });
    } else {
        next();
    }
});

export default router;
