<template>
	<div class="card">
		<div class="card-body">
			<a class="card-title">Aufteilung</a>
			<VueApexCharts height="350" type="donut" :options="options" :series="options.series"></VueApexCharts>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Cube } from "@/model/cube";
import { Connection } from "@/model/connection";
import { Series } from "@/model/series";
import VueApexCharts from "vue-apexcharts";
import moment, { Moment } from "moment";
import { DateRange } from "@/model/daterange";
import { services } from '@/main';
import { combineLatest } from 'rxjs';
import Util from '../../Util';

@Component({
	components: {
		VueApexCharts
	}
})
export default class SumPiePanel extends Vue {
	private options: any = {};

	created() {
		combineLatest(
			services.dateRange.getDateRange(),
			services.series.getSeries()
		).subscribe(([dateRange, series]) => {
			this.dateChanged(dateRange, series);
		});
	}

	dateChanged(dateRange: DateRange, series: Series[]) {
		this.options = this.generatePie(series, dateRange.start, dateRange.end, {
			plotOptions: {
				pie: {
					donut: {
						labels: {
							show: true,
							name: {
								show: true
							},
							value: {
								show: true,
								formatter: this.formatHourShort
							},
							total: {
								show: true,
								label: "Gesamt",
								color: "#111",
								formatter: this.formatTotalHourShort
							}
						}
					}
				}
			},
			chart: {
				height: 350,
				type: "donut"
			},
			legend: {
				show: false
			},
			name: {
				show: true
			},
			title: {
				align: "left"
			},
			yaxis: {
				labels: {
					formatter: this.formatHour
				}
			},
			dataLabels: {
				enabled: true,
				formatter: Util.formatPercent
			},
			colors: [],
			series: [],
			labels: []
		});
	}

	accumulateSeries(s: Series, start: Moment, end: Moment) {
		var sum = 0;
		for (var j = 0; j < s.data.length; j++) {
			var entry = s.data[j];
			if (start.unix() <= entry[1] && end.unix() >= entry[0]) {
				sum +=
					Math.min(entry[1], end.unix()) -
					Math.max(entry[0], start.unix());
			}
		}
		// We want the result in hours, not seconds
		return Math.round((sum / 3600) * 100) / 100;
	}

	accumulateRange(data: Series[], start: Moment, end: Moment) {
		var result = [];

		for (var i = 0; i < data.length; i++) {
			if (data[i].hide) {
				continue;
			}

			result.push({
				x: data[i].task,
				y: this.accumulateSeries(data[i], start, end),
				color: data[i].color
			});
		}

		return result;
	}

	generatePie(series: Series[], start: Moment, end: Moment, options = {}) {
		options.colors = [];
		options.series = [];
		options.labels = [];

		var dataAcc = this.accumulateRange(series, start, end);

		for (var j = 0; j < dataAcc.length; j++) {
			options.labels.push(dataAcc[j].x);
			options.series.push(dataAcc[j].y);
			options.colors.push(dataAcc[j].color);
		}

		return options;
	}

	formatTotalHourShort(w) {
		return (
			Math.round(
				w.globals.seriesTotals.reduce((a, b) => {
					return a + b;
				}, 0)
			) + "h"
		);
	}

	formatHourShort(val) {
		return Math.round(val) + "h";
	}

	formatHour(val) {
		var rounded = Math.round(val * 4);
		var quart = ["", "¼", "½", "¾"];
		if (rounded == 4) return "eine Stunde";
		else if (rounded == 0 || rounded > 4)
			return Math.floor(rounded / 4) + quart[rounded % 4] + " Stunden";
		else return quart[rounded % 4] + " Stunde";
	}

	formatHourMinute(val) {
		var hours = Math.floor(val);
		var minutes = Math.round((val - hours) * 60);

		var text = "";

		if (hours > 0) {
			if (hours == 1) text = "eine Stunde";
			else text = hours + " Stunden";
			if (minutes > 0) text += " und ";
		}
		if (minutes == 1) text += "eine Minute";
		else if (minutes > 1) text += minutes + " Minuten";

		return text;
	}
}
</script>
