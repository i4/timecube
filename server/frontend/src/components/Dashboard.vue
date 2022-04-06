<template>
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
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import DateRangePicker from "./DateRangePicker.vue";
import CubePanel from "./panels/CubePanel.vue";
import SumPiePanel from "./panels/SumPiePanel.vue";
import CategoryPanel from "./panels/CategoryPanel.vue";
import WorkPanel from "./panels/work-panel.vue";
import SumBarPanel from "./panels/sum-bar-panel.vue";
import WeekHeatmapPanel from "./panels/week-heatmap-panel.vue";
import OverviewTotalPanel from "./panels/overview-total-panel.vue";
import OverviewSumPanel from "./panels/overview-sum-panel.vue";
import YearHeatmapPanel from "./panels/year-heatmap-panel.vue";

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

@Component
export default class Dashboard extends Vue {
}
</script>

<style scoped>
</style>
