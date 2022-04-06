<template>
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
export default class WeekHeatmapPanel extends Vue {
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
		this.options = this.generateWeekHeatmap(
			series,
			dateRange.start,
			dateRange.end,
			sid,
			{
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
			}
		);
	}
	generateWeekHeatmap(
		data: Series[],
		start: Moment,
		end: Moment,
		sid = NaN,
		options = {},
		hourStep = 2
	) {
		let series = data.findIndex(s => s.sid === sid);
		if (series < 0) {
			series = NaN;
		}
		options.title.text = isNaN(series) ? "Gesamt" : data[series].task;
		options.title.style.color = isNaN(series)
			? "#222222"
			: data[series].color;
		options.colors = [isNaN(series) ? "#222222" : data[series].color];
		options.series = [];

		var result: number[][] = [];

		for (let j = 0; j < 24 / hourStep; j++) {
			var a = j * hourStep;
			options.series[j] = {
				name: a + " – " + (a + hourStep) + " Uhr",
				data: []
			};
			result[j] = [];
			for (let i = 0; i < 7; i++) result[j][i] = 0;
		}

		for (let i = 0; i < data.length; i++) {
			if (
				(isNaN(series) && data[i].hide) ||
				(!isNaN(series) && series != i)
			) {
				continue;
			}

			for (let j = 0; j < data[i].data.length; j++) {
				var e = data[i].data[j];
				if (e[1] >= start.unix() && e[0] <= end.unix()) {
					var t = new Date(e[1] * 1000);
					var f = new Date(Math.max(e[0], start.unix()) * 1000);
					while (t != null) {
						var slot = Math.floor(f.getHours() / hourStep);
						var x = new Date(
							f.getFullYear(),
							f.getMonth(),
							f.getDate(),
							(slot + 1) * hourStep,
							0,
							0,
							0
						);
						var dow = f.getDay();
						if (x > t) {
							result[slot][dow] += t.getTime() - f.getTime();
							break;
						} else {
							result[slot][dow] += x.getTime() - f.getTime();
							f = x;
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

		for (var j = 0; j < 24 / hourStep; j++) {
			for (var i = 0; i < 7; i++) {
				var d = (1 + i) % 7;
				options.series[j].data.push({
					x: weekdayName[d],
					y: isNaN(result[j][d])
						? 0
						: Math.round((result[j][d] / 3600000) * 100) / 100
				});
			}
		}

		return options;
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
