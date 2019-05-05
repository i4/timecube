var monthName = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September', 'Oktober','November','Dezember'];
var weekdayName = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
var holidays = [ "2019-01-01","2019-01-06","2019-04-19","2019-04-22","2019-05-01","2019-05-30","2019-06-10","2019-06-20","2019-10-03","2019-11-01","2019-12-25","2019-12-26"];

function accumulateLastWeek(data) {
	var endweek = Math.floor(new Date().getTime() / 1000);
	var startweek = new Date();
	startweek.setDate(startweek.getDate() - 6);
	startweek = Math.floor(startweek.getTime() / 1000);

	return accumulateRange(data, startweek, endweek);
}

function accumulateLastMonth(data) {
	var endmonth = Math.floor(new Date().getTime() / 1000);
	var startmonth = new Date();
	startmonth.setDate(startmonth.getDate() - 29);
	startmonth = Math.floor(startmonth.getTime() / 1000);

	return accumulateRange(data, startmonth, endmonth);
}

function accumulateThisYear(data) {
	var end = Math.floor(new Date().getTime() / 1000);
	var start = new Date(new Date().getFullYear(), 0, 1);
	start = Math.floor(start.getTime() / 1000);

	return accumulateRange(data, start, end);
}

function pie_accumulateLastWeek(data) {
	var result = [];

	var curDay = new Date();
	curDay.setDate(curDay.getDate() - 6);

	for (var i=0; i<7; i++) {
		// calculate start and end time
		var start = new Date(curDay.getTime());
		start.setHours(0,0,0,0);
		start = Math.floor(start.getTime() / 1000);
		var end = new Date(curDay.getTime());
		end.setHours(23, 59, 59, 999);
		end = Math.floor(end.getTime() / 1000);

		var dataAcc = accumulateRange(data, start, end);
		// Sort by label
		dataAcc.sort(function(a,b) { return (a.x < b.x) ? -1 : (a.x > b.x) ? 1 : 0 });
		var labels = [];
		var values = [];
		for (var j=0; j<dataAcc.length; j++) {
			labels.push(dataAcc[j].x);
			values.push(dataAcc[j].y);
		}
		// Format data to work with pie chart format
		result.push({
			day : weekday(curDay.getDay()) + ", " + curDay.getDate()
										   + "."  + (curDay.getMonth()+1)
										   + "."  + curDay.getFullYear()
										 ,
			labels : labels,
			data : values,
			color : colors[i],
			});

		curDay.setDate(curDay.getDate() + 1);
	}

	return result;
}

function heatmap_week(data) {
	var categories = [];
	var outData = [];

	var activities = [];
	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) continue;
		activities.push(data.series[i].task);

	}

	activities.sort(function(a,b) { return (a < b) ? 1 : (a > b) ? -1 : 0 }); 
	// Sort Activities alphabetically
	for (var i=0; i<activities.length; i++) {
		outData[i] = {
				name : activities[i],
				data : []
				};
	}

	var curDay = new Date();
	curDay.setDate(curDay.getDate() - 6);

	for (var i=0; i<7; i++) {
		// calculate start and end time
		var start = new Date(curDay.getTime());
		start.setHours(0,0,0,0);
		start = Math.floor(start.getTime() / 1000);
		var end = new Date(curDay.getTime());
		end.setHours(23, 59, 59, 999);
		end = Math.floor(end.getTime() / 1000);

		var dataAcc = accumulateRange(data, start, end);

		for (var j=0; j<dataAcc.length; j++) {
			outData[activities.indexOf(dataAcc[j].x)].data[i] = dataAcc[j].y;
		}
		categories.push(weekday(curDay.getDay()));

		curDay.setDate(curDay.getDate() + 1);
	}

	return {
		categories : categories,
		data : outData
		};
}

function weekday(day) {
	var days = ["Sonntag", "Montag", "Dienstag",
				"Mittwoch", "Donnerstag", "Freitag",
				"Samstag"];

	return days[day];
}

function newestUpdateIdx(data) {
	var max = 0, idx;
	for (var i=0; i<data.connection.length; i++) {
		if (data.connection[i].time > max) {
			max = data.connection[i].time;
			idx = i;
		}
	}
	return idx;
}

function lastUpdate(data) {
	var idx = newestUpdateIdx(data);
	// Date wants milliseconds
	var date = new Date(data.connection[idx].time * 1000);
	return weekdayName[date.getDay()] + ", den " + date.getDate() + ". "
				+ monthName[date.getMonth()] + " " + date.getFullYear() + " um "
				+ date.getHours() + ":" + date.getMinutes() + ":"
				+ date.getSeconds() + " Uhr";
				
}

function column_accumulateDaysLabel(from, until){
	var curDay = new Date(from);
	curDay.setHours(12,0,0,0);

	var untilDay = new Date(until);
	untilDay.setHours(23, 59, 59, 999);

	var dataArray = []
	for (var day = 0; curDay < untilDay; day++) { 
		dataArray.push(curDay.toISOString().substr(0,10));
		curDay.setDate(curDay.getDate() + 1);
	}
	return {
			type: 'datetime',
			categories: dataArray,
		};
}

function column_accumulateDays(data, from, until) {
	var result = [];

	var untilDay = new Date(until);
	untilDay.setHours(23, 59, 59, 999);

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}
		
		var curDay = new Date(from);
		curDay.setHours(0,0,0,0);

		var dataArray = [];
		for (var day = 0; curDay < untilDay; day++) {
			// calculate start and end time
			start = Math.floor(curDay.getTime() / 1000);

			curDay.setDate(curDay.getDate() + 1);
			end = Math.floor(curDay.getTime() / 1000);

			dataArray.push(accumulateSeries(data.series[i], start, end));
		}
		
		result.push(
			{
				name: data.series[i].task,
				data: dataArray,
				color : colors[i]
			}
		);
	}

	return result;
}

function accumulateSeries(series, start, end){
	var sum = 0;
	for (var j=0; j<series.data.length; j++) {
		var entry = series.data[j];
		if (start <= entry[1] && end >= entry[0]){
			sum += Math.min(entry[1], end) - Math.max(entry[0], start)
		}
	}
	// We want the result in hours, not seconds
	return Math.round((sum / 3600) * 100)/100;
}

function accumulateRange(data, start, end) {
	var result = [];

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}

		result.push(
			{
					x: data.series[i].task,
					y: accumulateSeries(data.series[i], start, end)
			}
		);
	}
	//result.sort(function(a,b) { return b.y - a.y} );

	return result;
}


function formatPercent(val) {
	return Math.round(val) + "%";
}

function formatHourShort(val) {
	return Math.round(val)+"h";
}

function formatHourLabel(val, opts) {
	var hours = 0;
	if (typeof opts.w.globals.series[opts.seriesIndex] == 'number')
		hours = Math.round(opts.w.globals.series[opts.seriesIndex]);
	else if (typeof opts.w.globals.series[opts.seriesIndex] === 'object')
		var hours = Math.round(opts.w.globals.series[opts.seriesIndex].reduce((a, b) => {
		return a + b
	}, 0));
	if (hours == 0)
		return val;
	else
		return val + " (" + hours + "h)"
}

function renderChart(elementId, options){
	var element = document.getElementById(elementId);
	if (element.chart === undefined)
		element.chart = new ApexCharts(document.getElementById(elementId), options);
	element.chart.render();
	$(element).on("chart", function (e) {
		element.chart.render();
	});
	return element.chart;
}

function renderChartLazy(elementId, optionCallback){
	var element = document.getElementById(elementId)
	$(element).on("chart", function (e) {
		$(element).off("chart");
		renderChart("profile", optionCallback());
	});
}


function formatTotalHourShort(w) {
	return Math.round(w.globals.seriesTotals.reduce((a, b) => {
		return a + b
	}, 0)) + "h";
}

function formatHour(val) {
	var rounded = Math.round(val * 4);
	var quart = ["", "¼", "½", "¾" ];
	if (rounded == 4)
		return "eine Stunde";
	else if (rounded == 0 || rounded > 4)
		return Math.floor(rounded/4) + quart[rounded % 4] + " Stunden";
	else
		return quart[rounded % 4] + " Stunde";
}


function getWorkDays(start, end){
	var workDays = 0;
	while (start < end){
		if (start.getDay() != 0 && start.getDay() != 6 && !holidays.includes(start.toISOString().substr(0,10))) 
			workDays++;
		start.setDate(start.getDate() + 1);
	}
	return workDays;
}


function getWorkedHours(data, start, end){
	var workHours = 0;
	for (var i=0; i<data.series.length; i++) {
		if (!data.series[i].hide)
			workHours += accumulateSeries(data.series[i], start.getTime() / 1000, end.getTime() / 1000);
	}
	return workHours;
}

function getWorkingTimePercent(data, start, end, leave = 30){
	return getWorkedHours(data, start, end) / ((getWorkDays(start, end) - leave) * 8.1);
}

Date.prototype.getWeekNumber = function(){
	var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	var dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
	return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

