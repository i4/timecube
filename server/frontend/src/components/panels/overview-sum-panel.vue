<template>
	<div class="card">
		<div class="card-body">
			<a
				href="#"
				class="card-title dropdown-toggle"
				role="button"
				id="overview-sum-dropdownx"
				data-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
			>Verlauf</a>
			<div
				class="dropdown-menu"
				id="overview-sum-dropdown-set"
				aria-labelledby="overview-sum-dropdown"
			>
				<a class="dropdown-item" href="#" v-on:click="stackType.next('single');">Einzeln</a>
				<a class="dropdown-item" href="#" v-on:click="stackType.next('stacked');">Gestapelt</a>
			</div>
			<VueApexCharts height="350" type="line" :options="options" :series="options.series"></VueApexCharts>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Cube } from "@/model/cube";
import { Connection } from "@/model/connection";
import { Series } from "@/model/series";
import VueApexCharts from "vue-apexcharts";
import moment, { Moment } from "moment";
import { DateRange } from "@/model/daterange";
import { services } from "@/main";
import { combineLatest, BehaviorSubject } from "rxjs";
import Util from "../../Util";

@Component({
	components: {
		VueApexCharts
	}
})
export default class OverviewSumPanel extends Vue {
	private stackType: BehaviorSubject<string> = new BehaviorSubject("stacked");
	private options: any = {};

	created() {
		combineLatest(
			services.dateRange.getDateRange(),
			services.series.getSeries(),
			this.stackType.asObservable()
		).subscribe(([dateRange, series, stackType]) => {
			this.dateChanged(dateRange, series, stackType);
		});
	}
	private setOverviewTotalStackType(type: string, options: any) {
		switch (type) {
			case "single":
				options.chart.type = "line";
				options.chart.stacked = false;
				break;
			case "stacked":
			default:
				options.chart.type = "area";
				options.chart.stacked = true;
				break;
		}
	}

	dateChanged(dateRange: DateRange, series: Series[], stackType: string) {
		this.options = this.generateDaySum(
			series,
			dateRange.start.unix(),
			dateRange.end.unix(),
			{
				chart: {
					type: "line",
					stacked: false,
					height: 350,
					toolbar: {
						show: true,
						tools: {
							download: false
						}
					},
					zoom: {
						enabled: true
					}
				},
				plotOptions: {
					line: {
						curve: "smooth"
					}
				},
				dataLabels: {
					enabled: false
				},

				yaxis: {
					labels: {
						formatter: this.formatHourShort
					}
				},
				xaxis: {
					type: "datetime",
					labels: {
						rotate: -30,
						datetimeFormatter: {
							year: "yyyy",
							month: "MMMM 'yy",
							day: "dd. MMMM",
							hour: "HH:mm"
						}
					}
				},
				tooltip: {
					shared: true,
					y: {
						formatter: this.formatHourShort
					}
				},
				legend: {
					position: "top"
				}
			}
		);
		this.setOverviewTotalStackType(stackType, this.options);
	}

	generateDaySum(series: Series[], start: number, end: number, options = {}) {
		options.series = [];
		options.colors = [];

		var untilDay = new Date(end * 1000);
		untilDay.setHours(23, 59, 59, 999);

		for (var i = 0; i < series.length; i++) {
			if (series[i].hide) {
				continue;
			}

			var curDay = new Date(start * 1000);
			curDay.setHours(0, 0, 0, 0);

			var sum = 0;
			var dataArray = [];
			while (curDay < untilDay) {
				// calculate start and end time
				let startTime = Math.floor(curDay.getTime() / 1000);

				curDay.setDate(curDay.getDate() + 1);
				let endTime = Math.floor(curDay.getTime() / 1000);

				for (var j = 0; j < series[i].data.length; j++) {
					var entry = series[i].data[j];
					if (startTime <= entry[1] && endTime >= entry[0]) {
						sum +=
							Math.min(entry[1], endTime) -
							Math.max(entry[0], startTime);
					}
				}

				dataArray.push([curDay.getTime(), sum / 3600]);
			}

			options.series.push({
				name: series[i].task,
				data: dataArray
			});

			options.colors.push(series[i].color);
		}
		return options;
	}

	accumulateSeries(s: Series, start: Moment, end: Moment) {
		var sum = 0;
		let st = start.unix();
		let et = end.unix();
		for (var j = 0; j < s.data.length; j++) {
			var entry = s.data[j];
			if (st <= entry[1] && et >= entry[0]) {
				sum += Math.min(entry[1], et) - Math.max(entry[0], st);
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

interface Options {
	colors?: string[];
}
</script>
