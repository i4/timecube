<template>
	<div class="card">
		<div class="card-body">
			<a class="card-title">Kategorien</a>

			<div class="category" v-for="element in series" :key="element.sid">
				<input
					:id="'cat-' + element.sid"
					type="checkbox"
					v-model="selected[element.sid].status"
					@change="changed()"
				/>
				<label :for="'cat-' + element.sid" :style="'background-color: ' + element.color"></label>
				<div class="icon">
					<span :class="'fas ' + element.icon"></span>
				</div>
				<a class="label disabled">{{ element.task }}</a>
				&nbsp;
				<span class="duration">(gesamt {{ Math.round(sumOfCategory(element) / 3600) }} h)</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Cube } from "@/model/cube";
import { Connection } from "@/model/connection";
import { Series } from "@/model/series";
import VueApexCharts from "vue-apexcharts";
import moment from "moment";
import { services } from "../../main";

@Component({
	components: {
		VueApexCharts
	}
})
export default class CategoryPanel extends Vue {
	private series: Series[] = [];
	private selected: CategorySelection[] = [];

	created() {
		services.series.getSeries().subscribe(series => {
			series.forEach(s => {
				this.selected[s.sid] = {
					sid: s.sid,
					status: !s.hide,
					task: s.task
				};
			});
			this.series = series;
		});
	}

	sumOfCategory(series: Series): number {
		return series.data
			.map(d => d[1] - d[0])
			.filter(x => x > 0)
			.reduce((previous, current) => previous + current, 0);
	}

	changed(): void {
		let hidden: string[] = this.selected
			.filter(s => !s.status)
			.map(s => s.task);
		services.series.setHidden(hidden);
	}
}

interface CategorySelection {
	sid: number;
	status: boolean;
	task: string;
}
</script>

<style scoped>
.card {
	box-shadow: 0px 1px 22px -12px #607d8b;
	background-color: #fff;
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
</style>