<template>
	<div id="reportrange">
		<i class="fa fa-calendar"></i>&nbsp;
		<span v-if="label !== 'Datumsauswahl'">{{ label }},</span>
		{{ dateRange.start.format("D. MMMM YYYY") }} - {{ dateRange.end.format("D. MMMM YYYY") }}
		<i
			class="fa fa-caret-down"
		></i>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { DateRange } from "@/model/daterange";
import * as moment from "moment";
import { services } from "@/main";
require("daterangepicker");

@Component({})
export default class DateRangePicker extends Vue {
	private dateRange: DateRange = { start: moment(), end: moment() };
	private label: string = "Datumsauswahl";

	mounted() {
		var self = this;
		moment.locale("de");
		var startRangeMoment = moment.min(moment(), moment().subtract(1, "year"));
		var startRange = startRangeMoment.unix();
		var endRange = startRange;
		var endRangeMoment = moment();
		this.dateRange = { start: startRangeMoment, end: endRangeMoment };

		var pickerRanges = {
			Alles: [startRangeMoment, endRangeMoment],
			"Vergangene 30 Tage": [moment().subtract(29, "days"), moment()],
			"Vergangene 7 Tage": [moment().subtract(6, "days"), moment()],
			"Letzte Woche": [
				moment()
					.subtract(1, "week")
					.startOf("week"),
				moment()
					.subtract(1, "week")
					.endOf("week")
			],
			"Diese Woche": [moment().startOf("week"), moment().endOf("week")],
			"Letzter Monat": [
				moment()
					.subtract(1, "month")
					.startOf("month"),
				moment()
					.subtract(1, "month")
					.endOf("month")
			],
			"Dieser Monat": [moment().startOf("month"), moment().endOf("month")],
			"Letztes Jahr": [
				moment()
					.subtract(1, "year")
					.startOf("year"),
				moment()
					.subtract(1, "year")
					.endOf("year")
			],
			"Dieses Jahr": [moment().startOf("year"), moment().endOf("year")]
		};
		// for (
		// 	var year = new Date(minTime * 1000).getFullYear() - 1;
		// 	year <= new Date().getFullYear();
		// 	year++
		// ) {
		// 	var y = year % 100;
		// 	pickerRanges["SoSe " + y] = [
		// 		moment(year + "-04-01T00:00:00"),
		// 		moment(year + "-10-01T00:00:00")
		// 	];
		// 	pickerRanges["WiSe " + y + "/" + (y + 1)] = [
		// 		moment(year + "-10-01T00:00:00"),
		// 		moment(year + 1 + "-04-01T00:00:00")
		// 	];
		// }

		$("#reportrange").daterangepicker(
			{
				showDropdowns: true,
				showWeekNumbers: true,
				timePicker: true,
				timePicker24Hour: true,
				ranges: pickerRanges,
				locale: {
					format: "YYYY-MM-DD",
					separator: " — ",
					applyLabel: "Auswählen",
					cancelLabel: "Abbrechen",
					fromLabel: "Von",
					toLabel: "Bis",
					customRangeLabel: "Datumsauswahl",
					weekLabel: "W",
					// daysOfWeek: weekdayShort,
					// monthNames: monthName,
					firstDay: 1
				},
				alwaysShowCalendars: false,
				// minDate: moment.unix(minTime),
				maxDate: moment(),
				startDate: startRangeMoment,
				endDate: endRangeMoment
			},
			function(start: moment, end: moment, label: moment) {
				self.dateRange = { start: start, end: end };
				self.label = label;
				services.dateRange.setDateRange(self.dateRange);
			}
		);
	}
}
</script>
