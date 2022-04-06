import { dom, library } from '@fortawesome/fontawesome-svg-core';
import { faBed, faCalendar, faCaretDown, faChalkboardTeacher, faCog, faCube, faFlask, faMugHot, faQuestionCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "daterangepicker/daterangepicker.css";
import "apexcharts/dist/apexcharts.css";
import $ from 'jquery';
import Vue from "vue";
import App from "./App.vue";
import { DateRangeService } from './services/DateRangeService';
import { CubeService } from './services/CubeService';
import { SeriesService } from './services/SeriesService';

export const services = {
  dateRange: new DateRangeService(),
  cube: new CubeService(),
  series: new SeriesService()
}

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


dom.watch()
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false;

window.services = services;
window.$ = $;
window.jQuery = $;

new Vue({
  render: h => h(App)
}).$mount("#app");
