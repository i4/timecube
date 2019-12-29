<template>
	<div class="card">
		<div class="card-body">
			<a class="card-title">Arbeitszeit</a>
			<VueApexCharts
				width="350"
				height="300"
				type="radialBar"
				:options="this.options"
				:series="this.options.series"
			></VueApexCharts>
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
import { DateRange } from "@/model/daterange";
import { services } from "@/main";
import { combineLatest } from 'rxjs';

@Component({
	components: {
		VueApexCharts
	}
})
export default class WorkPanel extends Vue {
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
		this.options = this.generateWorkCircle(
			series,
			dateRange.start,
			dateRange.end,
			{
				plotOptions: {
					radialBar: {
						size: 150,
						inverseOrder: true,
						startAngle: -180,
						offsetX: -40,
						endAngle: 90,
						hollow: {
							size: "30%"
						},
						track: {
							show: true,
							margin: 10
						},

						dataLabels: {
							value: {
								formatter: function(val) {
									return Math.round(val) + "%";
								}
							},
							total: {
								show: false
							}
						}
					}
				},
				stroke: {
					lineCap: "round"
				},
				legend: {
					show: true,
					floating: true,
					position: "left",
					offsetX: 110,
					offsetY: 173,
					labels: {
						useSeriesColors: true
					},
					markers: {
						width: 0,
						height: 0
					},
					itemMargin: {
						horizontal: 0
					},
					formatter: function(seriesName, opts) {
						return seriesName + ": " + opts.w.config.timetext[opts.seriesIndex];
					}
				}
			}
		);
	}

	accumulateSeries(series: Series, start, end) {
		var sum = 0;
		for (var j = 0; j < series.data.length; j++) {
			var entry = series.data[j];
			if (start <= entry[1] && end >= entry[0]) {
				sum += Math.min(entry[1], end) - Math.max(entry[0], start);
			}
		}
		// We want the result in hours, not seconds
		return Math.round((sum / 3600) * 100) / 100;
	}

	private getWorkDays(start: Date, end: Date): number {
		console.log("getWorkdays");
		var holidays = [
			"2019-01-01",
			"2019-01-06",
			"2019-04-19",
			"2019-04-22",
			"2019-05-01",
			"2019-05-30",
			"2019-06-10",
			"2019-06-20",
			"2019-10-03",
			"2019-11-01",
			"2019-12-25",
			"2019-12-26"
		];
		var dateHolidays = holidays.map(dateString => moment(dateString));
		var s = moment(
			new Date(start.getFullYear(), start.getMonth(), start.getDay())
		);
		var workDays = 0;
		var e = moment(end);

		let x = dateHolidays
			.filter(d => d.weekday() !== 0)
			.filter(d => d.weekday() !== 6).length;
		while (s.isBefore(e)) {
			if (s.weekday() != 0 && s.weekday() != 6 && !dateHolidays.includes(s)) {
				workDays++;
			}
			s = s.add(1, "days");
		}

		return workDays;
	}

	getWorkedHours(series: Series[], start, end) {
		var workHours = 0;
		for (var i = 0; i < series.length; i++) {
			if (!series[i].hide) {
				workHours += this.accumulateSeries(
					series[i],
					start.getTime() / 1000,
					end.getTime() / 1000
				);
			}
		}
		return workHours;
	}

	generateWorkCircleHelper(
		data: Series[],
		options,
		begin: Date,
		end: Date,
		title: string,
		color: string,
		leave: number = 0
	) {
		let minTime = 1573552800;
		var min = new Date(minTime * 1000);
		if (begin < min) begin = min;
		var req = (this.getWorkDays(begin, end) - leave) * 8; //dailyWorkHours;
		var did = this.getWorkedHours(data, begin, end);

		options.series.push((did / req) * 100);
		options.timetext.push(Math.round(did) + "h / " + Math.round(req) + "h");
		options.labels.push(title);
		options.colors.push(color);
	}
	generateWorkCircle(data: Series[], start: moment, end: moment, options = {}) {
		options.colors = [];
		options.series = [];
		options.labels = [];
		options.timetext = [];

		var dateStart = new Date(start.unix() * 1000);
		var dateEnd = new Date(end.unix() * 1000);
		this.generateWorkCircleHelper(
			data,
			options,
			dateStart,
			dateEnd,
			"Zeitraum",
			"#222222"
		);

		var dateNow = new Date();

		var weekBegin = new Date(
			dateNow.getFullYear(),
			dateNow.getMonth(),
			dateNow.getDate() + (dateNow.getDay() == 0 ? -6 : 1) - dateNow.getDay()
		);
		var weekEnd = new Date(weekBegin);
		weekEnd.setDate(weekBegin.getDate() + 7);
		weekEnd.setHours(0, 0, 0, 0);
		this.generateWorkCircleHelper(
			data,
			options,
			weekBegin,
			weekEnd,
			"Woche",
			"#39539E"
		);

		var monthBegin = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
		var monthEnd = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 1);
		this.generateWorkCircleHelper(
			data,
			options,
			monthBegin,
			monthEnd,
			"Monat",
			"#0077B5"
		);

		var yearBegin = new Date(dateNow.getFullYear(), 0, 1);
		var yearEnd = new Date(dateNow.getFullYear() + 1, 0, 1);
		this.generateWorkCircleHelper(
			data,
			options,
			yearBegin,
			yearEnd,
			"Jahr",
			"#0084ff",
			30 //annualLeave
		);

		return options;
	}
}
</script>
