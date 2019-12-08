<template>
	<div id="app">
		<nav id="head" class="navbar navbar-expand-lg sticky-top justify-content-between">
			<div style="width: 100%" class="content-area">
				<a class="navbar-brand" href="#" id="header">Zeiterfassungswürfel</a>

				<div id="reportrange">
					<i class="fa fa-calendar"></i>&nbsp;
					<span></span>
					<i class="fa fa-caret-down"></i>
				</div>
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
						<div class="card">
							<div id="cubes" class="card-body">
								<a class="card-title">Würfel</a>
							</div>
						</div>
					</div>

					<div class="col-md-3 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a class="card-title">Arbeitszeit</a>
								<div id="chart-work"></div>
							</div>
						</div>
					</div>

					<div class="col-md-5 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a
									href="#"
									class="card-title dropdown-toggle"
									role="button"
									id="week-heatmap-dropdown"
									data-toggle="dropdown"
									aria-haspopup="true"
									aria-expanded="false"
								>Wöchentliche Verteilung</a>
								<div
									class="dropdown-menu"
									id="week-heatmap-dropdown-set"
									aria-labelledby="week-heatmap-dropdown"
								></div>
								<div id="chart-week-heatmap"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="row">
					<div class="col-md-3 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a class="card-title">Kategorien</a>
								<div id="categories"></div>
							</div>
						</div>
					</div>

					<div class="col-md-3 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a class="card-title">Aufteilung</a>
								<div id="chart-sum-pie"></div>
							</div>
						</div>
					</div>

					<div class="col-md-6 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a class="card-title">Summe</a>
								<div id="chart-sum-bar"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="row">
					<div class="col-md-6 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a
									href="#"
									class="card-title dropdown-toggle"
									role="button"
									id="overview-total-dropdown"
									data-toggle="dropdown"
									aria-haspopup="true"
									aria-expanded="false"
								>Tagesübersicht</a>
								<div
									class="dropdown-menu"
									id="overview-total-dropdown-set"
									aria-labelledby="overview-total-dropdown"
								>
									<a class="dropdown-item" href="javascript:setOverviewTotalStackType('single');">Einzeln</a>
									<a class="dropdown-item" href="javascript:setOverviewTotalStackType('stacked');">Gestapelt</a>
									<a class="dropdown-item" href="javascript:setOverviewTotalStackType('percent');">Prozentual</a>
								</div>
								<div id="chart-overview-total"></div>
							</div>
						</div>
					</div>
					<div class="col-md-6 mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a
									href="#"
									class="card-title dropdown-toggle"
									role="button"
									id="overview-sum-dropdown"
									data-toggle="dropdown"
									aria-haspopup="true"
									aria-expanded="false"
								>Verlauf</a>
								<div
									class="dropdown-menu"
									id="overview-sum-dropdown-set"
									aria-labelledby="overview-sum-dropdown"
								>
									<a class="dropdown-item" href="javascript:setOverviewSumStackType('single');">Einzeln</a>
									<a class="dropdown-item" href="javascript:setOverviewSumStackType('stacked');">Gestapelt</a>
								</div>
								<div id="chart-overview-sum"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="row">
					<div class="col mt-3 mb-3">
						<div class="card">
							<div class="card-body">
								<a
									href="#"
									class="card-title dropdown-toggle"
									role="button"
									id="year-heatmap-dropdown"
									data-toggle="dropdown"
									aria-haspopup="true"
									aria-expanded="false"
								>Jahresüberblick</a>
								<div
									class="dropdown-menu"
									id="year-heatmap-dropdown-set"
									aria-labelledby="year-heatmap-dropdown"
								></div>
								<div id="chart-year-heatmap"></div>
							</div>
						</div>
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
import moment from "moment";
import Apex from "apexcharts";
import ApexCharts from "apexcharts";
require("daterangepicker");

import "daterangepicker/daterangepicker.css";
import "apexcharts/dist/apexcharts.css";

window.moment = moment;
window.Apex = Apex;
window.ApexCharts = ApexCharts;

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
		this.loadScript("js/charts.js");
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

.category {
	position: relative;
	margin: 10px;
}

.category a {
	margin-left: 10px;
}

.category label {
	width: 20px;
	height: 20px;
	cursor: pointer;
	position: absolute;
	top: 3px;
	left: 0;
	border-radius: 4px;
}

.category label:after {
	content: "";
	width: 9px;
	height: 5px;
	position: absolute;
	top: 7px;
	left: 5px;
	border: 3px solid #fcfff4;
	border-top: none;
	border-right: none;
	background: transparent;
	opacity: 0;
	-webkit-transform: rotate(-45deg);
	transform: rotate(-45deg);
}

.category label:hover::after {
	opacity: 0.3;
}

.category input[type="checkbox"] {
	visibility: hidden;
}

.category input[type="checkbox"]:checked + label:after {
	opacity: 1;
}

.category div.icon {
	display: inline-block;
	width: 2em;
	padding-left: 3px;
	text-align: center;
}

.category a.label {
	margin: 0px;
	padding: 0px;
}

.category span.duration {
	font-size: 0.7em;
	font-style: italic;
}

.inline {
	display: inline-block;
	vertical-align: middle;
}
</style>
