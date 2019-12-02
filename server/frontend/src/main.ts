import Vue from "vue";
import App from "./App.vue";
import $ from 'jquery';

Vue.config.productionTip = false;

window.$ = $;
window.jQuery = $;

new Vue({
  render: h => h(App)
}).$mount("#app");
