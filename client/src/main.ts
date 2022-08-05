import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');
