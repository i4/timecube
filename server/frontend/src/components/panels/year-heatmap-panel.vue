<template>
	<div class="card">
		<div class="card-body">
			<a
				href="#"
				class="card-title dropdown-toggle"
				role="button"
				id="year-heatmap-dropdownx"
				data-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
			>Jahresüberblick</a>
			<div
				class="dropdown-menu"
				id="year-heatmap-dropdown-set"
				aria-labelledby="year-heatmap-dropdown"
			>
				<a
					href="#"
					class="dropdown-item"
					v-for="element in categories"
					:key="element.id"
					v-on:click="selectedSid.next(element.id)"
				>
					<span :style="'color:' + element.color  + ';'">⬤</span>
					&nbsp; {{ element.name }}
				</a>
				<div class="dropdown-divider"></div>
				<a href="#" class="dropdown-item" v-on:click="selectedSid.next(NaN)">
					<b>Gesamt</b>
				</a>
			</div>
			<VueApexCharts height="350" type="heatmap" :options="options" :series="options.series"></VueApexCharts>
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

interface CategoryInfo {
	id: number;
	name: string;
	color: string;
}

@Component({
	components: {
		VueApexCharts
	}
})
export default class YearHeatmapPanel extends Vue {
	private selectedSid: BehaviorSubject<number> = new BehaviorSubject(NaN);
	private categories: CategoryInfo[] = [];
	private options: any = {};

	created() {
		combineLatest(
			services.dateRange.getDateRange(),
			services.series.getSeries(),
			this.selectedSid.asObservable()
		).subscribe(([dateRange, series, selectedSid]) => {
			this.dateChanged(dateRange, series, selectedSid);
			this.categories = series.map(s => {
				return { id: s.sid, name: s.task, color: s.color };
			});
		});
	}

	dateChanged(dateRange: DateRange, series: Series[], sid: number) {
		this.options = this.generateYearHeatmap(series, sid, {
			chart: {
				height: 350,
				type: "heatmap",
				toolbar: {
					show: false
				}
			},
			title: {
				align: "center",
				floating: true,
				style: {}
			},
			dataLabels: {
				enabled: false
			},

			tooltip: {
				y: {
					formatter: this.formatHour
				},
				x: {
					show: true
				}
			}
		});
	}

	generateYearHeatmap(data: Series[], sid = NaN, options = {}) {
		let series = data.findIndex(s => s.sid === sid);
		if (series < 0) {
			series = NaN;
		}
		options.title.text = isNaN(series)
			? "Gesamt"
			: data[series].task;
		options.title.style.color = isNaN(series)
			? "#222222"
			: data[series].color;
		options.colors = [isNaN(series) ? "#222222" : data[series].color];
		options.series = [];

		var result = [];
		var nowTime = Date.now();
		var now = new Date(nowTime);
		var start = new Date(nowTime);
		start.setHours(0, 0, 0, 0);
		start.setFullYear(start.getFullYear() - 1);
		var dayTime = 24 * 60 * 60 * 1000;
		var days = Math.ceil((now.getTime() - start.getTime()) / dayTime);

		for (var i = 0; i < data.length; i++) {
			if (
				(isNaN(series) && data[i].hide) ||
				(!isNaN(series) && series != i)
			)
				continue;
			for (var j = 0; j < data[i].data.length; j++) {
				let a = data[i].data[j];
				let t = new Date(a[1] * 1000);
				if (t.getTime() > start.getTime()) {
					var f = new Date(Math.max(a[0] * 1000, start.getTime()));
					let e: Date = new Date(
						f.getFullYear(),
						f.getMonth(),
						f.getDate(),
						23,
						59,
						59,
						1000
					);
					while (e != null) {
						e = new Date(
							f.getFullYear(),
							f.getMonth(),
							f.getDate(),
							23,
							59,
							59,
							1000
						);
						var d = Math.floor(
							(e.getTime() - start.getTime()) / dayTime
						);
						if (isNaN(result[d])) result[d] = 0;
						if (e > t) {
							result[d] += t.getTime() - f.getTime();
							break;
						} else {
							result[d] += e.getTime() - f.getTime();
							f = e;
						}
					}
				}
			}
		}
		var monthName = [
			"Januar",
			"Februar",
			"März",
			"April",
			"Mai",
			"Juni",
			"Juli",
			"August",
			"September",
			"Oktober",
			"November",
			"Dezember"
		];
		var monthShort = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mai",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Okt",
			"Nov",
			"Dez"
		];
		var weekdayName = [
			"Sonntag",
			"Montag",
			"Dienstag",
			"Mittwoch",
			"Donnerstag",
			"Freitag",
			"Samstag"
		];
		var weekdayShort = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
		for (var k = 0; k < 7; k++) {
			options.series[(14 - k) % 7] = {
				name: weekdayName[k],
				data: []
			};
		}
		for (var l = 0; start < now; l++) {
			options.series[(8 - start.getDay()) % 7].data.push({
				x: "KW" + moment(start).week() + " " + start.getFullYear(),
				y: isNaN(result[l])
					? 0
					: Math.round((result[l] / 3600000) * 100) / 100
			});
			start.setDate(start.getDate() + 1);
		}

		return options;
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
