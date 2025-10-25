import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from '@/routes';
import App from '@/App.vue';
import '@/assets/main.css';

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faUsers,
  faLock,
  faUnlock,
  faXmark,
  faUserXmark,
  faBookmark as faBookmarkSolid,
  faPhone,
  faPhoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';

// Add icons to library
library.add(
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faUsers,
  faLock,
  faUnlock,
  faXmark,
  faUserXmark,
  faBookmarkSolid,
  faBookmarkRegular,
  faPhone,
  faPhoneSlash,
);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

// Register Font Awesome component globally
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(pinia);
app.use(router);

app.mount('#app');
