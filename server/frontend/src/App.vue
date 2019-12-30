<template>
	<div id="app">
		<nav id="head" class="navbar navbar-expand-lg sticky-top justify-content-between">
			<div style="width: 100%" class="content-area">
				<a class="navbar-brand" href="#" id="header">Zeiterfassungswürfel</a>

				<date-range-picker />
				<!--div class="collapse navbar-collapse">
			<ul class="navbar-nav mr-auto mt-2 mt-lg-0">
				<li class="nav-item active">
					<a class="nav-link" href="#">Übersicht <span class="sr-only">(current)</span></a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#">Einstellungen</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#">Abmelden</a>
				</li>
			</ul>
				</div-->
			</div>
		</nav>

		<div class="content-area">
			<div class="container-fluid">
				<div class="row">
					<div class="col-md-4 mt-3 mb-3">
						<cube-panel />
					</div>

					<div class="col-md-3 mt-3 mb-3">
						<work-panel />
					</div>

					<div class="col-md-5 mt-3 mb-3">
						<week-heatmap-panel />
					</div>
				</div>

				<div class="row">
					<div class="col-md-3 mt-3 mb-3">
						<category-panel />
					</div>

					<div class="col-md-3 mt-3 mb-3">
						<sum-pie-panel />
					</div>

					<div class="col-md-6 mt-3 mb-3">
						<sum-bar-panel />
					</div>
				</div>

				<div class="row">
					<div class="col-md-6 mt-3 mb-3">
						<overview-total-panel />
					</div>
					<div class="col-md-6 mt-3 mb-3">
						<overview-sum-panel />
					</div>
				</div>

				<div class="row">
					<div class="col mt-3 mb-3">
						<year-heatmap-panel />
					</div>
				</div>
			</div>
		</div>

		<Dashboard />

		<Footer />
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Dashboard from "./components/Dashboard.vue";
import Footer from "./components/Footer.vue";
import DateRangePicker from "./components/DateRangePicker.vue";
import CubePanel from "./components/panels/CubePanel.vue";
import SumPiePanel from "./components/panels/SumPiePanel.vue";
import CategoryPanel from "./components/panels/CategoryPanel.vue";
import WorkPanel from "./components/panels/work-panel.vue";
import SumBarPanel from "./components/panels/sum-bar-panel.vue";
import WeekHeatmapPanel from "./components/panels/week-heatmap-panel.vue";
import OverviewTotalPanel from "./components/panels/overview-total-panel.vue";
import OverviewSumPanel from "./components/panels/overview-sum-panel.vue";
import YearHeatmapPanel from "./components/panels/year-heatmap-panel.vue";
import moment from "moment";
require("daterangepicker");

import "daterangepicker/daterangepicker.css";
import "apexcharts/dist/apexcharts.css";

Vue.component("date-range-picker", DateRangePicker);
Vue.component("cube-panel", CubePanel);
Vue.component("sum-pie-panel", SumPiePanel);
Vue.component("category-panel", CategoryPanel);
Vue.component("work-panel", WorkPanel);
Vue.component("sum-bar-panel", SumBarPanel);
Vue.component("week-heatmap-panel", WeekHeatmapPanel);
Vue.component("overview-total-panel", OverviewTotalPanel);
Vue.component("overview-sum-panel", OverviewSumPanel);
Vue.component("year-heatmap-panel", YearHeatmapPanel);

window.moment = moment;

@Component({
	components: {
		Dashboard,
		Footer
	}
})
export default class App extends Vue {
	mounted(): void {
		this.loadScript("data.js");
		this.loadScript("js/config.js");
		this.loadScript("js/helper.js");
	}

	loadScript(url: string): void {
		let script = document.createElement("script");
		script.setAttribute("src", url);
		script.async = false;
		document.body.appendChild(script);
	}
}
</script>



<style>
body {
	background-color: #eff4f7;
	color: #777;
}

.card-title {
	font-weight: 600;
	font-size: 1.1em;
	color: #777;
	margin-bottom: 38px;
}

.content-area {
	max-width: 1600px;
	margin: 0 auto;
}

#reportrange {
	font-size: 0.9em;
	cursor: pointer;
	float: right;
	margin: 8px;
}

.header {
	font-weight: 600;
	font-size: 1.5em;
}

@media screen and (max-width: 760px) {
	#header {
		display: none;
	}
}

.card {
	box-shadow: 0px 1px 22px -12px #607d8b;
	background-color: #fff;
}

.navbar {
	padding: 0;
}

#head {
	box-shadow: 0px 1px 22px -12px #607d8b;
	background-color: #fff;
	padding: 5px;
	padding-left: 15px;
	padding-right: 15px;
}

.inline {
	display: inline-block;
	vertical-align: middle;
}
</style>
