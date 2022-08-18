import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';

let app = createApp(App);
let pinia = createPinia();
app.use(pinia);
app.mount('#app');

export function resetApp() {
  app.unmount();
  app = createApp(App);
  pinia = createPinia();
  app.use(pinia);
  app.mount('#app');
}
