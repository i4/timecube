<template>
	<div class="card">
		<div class="card-body">
			<a
				href="#"
				class="card-title dropdown-toggle"
				role="button"
				id="overview-total-dropdownx"
				data-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
			>Tagesübersicht</a>
			<div
				class="dropdown-menu"
				id="overview-total-dropdown-set"
				aria-labelledby="overview-total-dropdown"
			>
				<a class="dropdown-item" href="#" v-on:click="stackType.next('single');">Einzeln</a>
				<a class="dropdown-item" href="#" v-on:click="stackType.next('stacked');">Gestapelt</a>
				<a class="dropdown-item" href="#" v-on:click="stackType.next('percent');">Prozentual</a>
			</div>
			<VueApexCharts height="350" type="bar" :options="options" :series="options.series"></VueApexCharts>
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
export default class OverviewTotalPanel extends Vue {
	private stackType: BehaviorSubject<string> = new BehaviorSubject("stacked");
	private options: any = {};

	formatPercent(val) {
		return Math.round(val) + "%";
	}

	created() {
		combineLatest(
			services.dateRange.getDateRange(),
			services.series.getSeries(),
			this.stackType.asObservable()
		).subscribe(([dateRange, series, stackType]) => {
			this.dateChanged(dateRange, series, stackType);
		});
	}

	dateChanged(dateRange: DateRange, series: Series[], stackType: string) {
		this.options = this.generateDayTimeBar(
			series,
			dateRange.start.unix(),
			dateRange.end.unix(),
			{
				chart: {
					height: 350,
					type: "bar",
					stacked: true,
					stackType: "normal",
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
					bar: {
						horizontal: false,
						endingShape: "flat",
						distributed: false
					}
				},
				yaxis: {
					max: 24,
					labels: {
						formatter: this.formatHourShort
					}
				},
				xaxis: {
					type: "datetime",
					labels: {
						datetimeFormatter: {
							year: "yyyy",
							month: "MMMM 'yy",
							day: "dd. MMMM",
							hour: "HH:mm"
						}
					}
				},
				dataLabels: {
					enabled: false
				},
				legend: {
					position: "top"
				},
				tooltip: {
					x: {
						format: "d. MMMM yyyy"
					}
				}
			}
		);
		this.setOverviewTotalStackType(stackType, this.options);
	}
	private setOverviewTotalStackType(type: string, options: any) {
		switch (type) {
			case "percent":
				options.chart.stacked = true;
				options.chart.stackType = "100%";
				options.yaxis.max = 100;
				options.yaxis.labels = {
					formatter: Util.formatPercent
				};
				break;
			case "single":
				options.chart.stacked = false;
				options.chart.stackType = "normal";
				options.yaxis.max = function(max) {
					return max;
				};
				options.yaxis.labels = {
					formatter: this.formatHourShort
				};
				break;
			case "stacked":
			default:
				options.chart.stacked = true;
				options.chart.stackType = "normal";
				options.yaxis.max = 24;
				options.yaxis.labels = {
					formatter: this.formatHourShort
				};
				break;
		}
	}
	generateDayTimeBar(
		series: Series[],
		start: number,
		end: number,
		options = {}
	) {
		options.series = [];
		options.xaxis.categories = [];
		options.colors = [];

		var untilDay = new Date(end * 1000);
		untilDay.setHours(23, 59, 59, 999);

		for (var i = 0; i < series.length; i++) {
			if (series[i].hide) {
				continue;
			}

			var curDay = new Date(start * 1000);
			curDay.setHours(0, 0, 0, 0);
			var dataArray: number[] = [];
			let daycount = 0;
			for (var day = 0; curDay < untilDay; day++) {
				// calculate start and end time
				let startTime = Math.floor(curDay.getTime());
				daycount++;
				curDay.setDate(curDay.getDate() + 1);
				let endTime = Math.floor(curDay.getTime());

				dataArray.push(
					this.accumulateSeries(
						series[i],
						moment(startTime),
						moment(endTime)
					)
				);
			}
			options.series.push({
				name: series[i].task,
				data: dataArray
			});
			options.colors.push(series[i].color);
		}

		curDay = new Date(start * 1000);
		curDay.setHours(12, 0, 0, 0);
		while (curDay < untilDay) {
			options.xaxis.categories.push(curDay.toISOString());
			curDay.setDate(curDay.getDate() + 1);
		}
		return options;
	}

	accumulateSeries(s: Series, start: Moment, end: Moment): number {
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
