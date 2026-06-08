/// <reference types="vite/client" />

// @see https://github.com/vuejs/vue-class-component/issues/219
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}
