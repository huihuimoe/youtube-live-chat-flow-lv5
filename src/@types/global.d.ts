/// <reference types="vite/client" />

// @see https://github.com/vuejs/vue-class-component/issues/219
declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
