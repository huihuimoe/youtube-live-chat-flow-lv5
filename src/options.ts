import { createApp } from 'vue'
import App from '~/components/App.vue'
import vuetify from '~/plugins/vuetify'
import { pinia, readyStore } from '~/store'

const mountApp = async () => {
  await readyStore()
  createApp(App).use(pinia).use(vuetify).mount('#app')
}

void mountApp()
