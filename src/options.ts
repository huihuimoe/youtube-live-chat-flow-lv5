import Vue from 'vue'
import type { ComponentOptions, CreateElement } from 'vue'
import type Vuetify from 'vuetify'
import App from '~/components/App.vue'
import vuetify from '~/plugins/vuetify'

/**
 * tsgo does not currently pick up Vuetify 2's ComponentOptions augmentation.
 */
const appOptions: ComponentOptions<Vue> & { vuetify: Vuetify } = {
  el: '#app',
  render: (createElement: CreateElement) => createElement(App),
  vuetify,
}

new Vue(appOptions)
