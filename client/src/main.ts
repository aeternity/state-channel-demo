import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';

let app = createApp(App);
let pinia = createPinia();
app.use(pinia);

if (process.env.NODE_ENV !== 'test') app.mount('#app');

export function resetApp() {
  window.location.search = '';
  localStorage.removeItem('gameState');
  app.unmount();
  app = createApp(App);
  pinia = createPinia();
  app.use(pinia);
  app.mount('#app');
}
