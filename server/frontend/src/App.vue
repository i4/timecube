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
			<Dashboard />
		</div>

		<Footer />
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Dashboard from "./components/Dashboard.vue";
import Footer from "./components/Footer.vue";

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
