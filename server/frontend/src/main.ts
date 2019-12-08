import Vue from "vue";
import App from "./App.vue";
import $ from 'jquery';
import { library,dom } from '@fortawesome/fontawesome-svg-core'
import { faQuestionCircle, faFlask, faChalkboardTeacher, faMugHot, faUsers, faCog, faBed, faCalendar, faCaretDown, faCube } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faQuestionCircle);
library.add(faFlask);
library.add(faChalkboardTeacher);
library.add(faMugHot);
library.add(faUsers);
library.add(faCog);
library.add(faBed);
library.add(faCalendar);
library.add(faCaretDown);
library.add(faCube);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";

dom.watch()
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false;

window.$ = $;
window.jQuery = $;

new Vue({
  render: h => h(App)
}).$mount("#app");
