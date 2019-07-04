// Helper

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
					y: accumulateSeries(data.series[i], start, end),
					color: data.series[i].color
			}
		);
	}

	return result;
}


function getWorkDays(start, end){
	var s = new Date(start);
	var workDays = 0;
	while (s < end){
		if (s.getDay() != 0 && s.getDay() != 6 && !holidays.includes(s.toISOString().substr(0,10)))
			workDays++;
		s.setDate(s.getDate() + 1);
	}
	return workDays;
}


function getWorkedHours(data, start, end){
	var workHours = 0;
	for (var i=0; i<data.series.length; i++) {
		if (!data.series[i].hide){
			workHours += accumulateSeries(data.series[i], start.getTime() / 1000, end.getTime() / 1000);
		}
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


// Chart label formatter

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


function formatTotalHourShort(w) {
	return Math.round(w.globals.seriesTotals.reduce((a, b) => {
		return a + b
	}, 0)) + "h";
}


function formatHourShort(val) {
	return Math.round(val) + "h";
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


function formatHourMinute(val) {
	var hours = Math.floor(val);
	var minutes = Math.round((val - hours)*60);

	var text = "";

	if (hours > 0){
		if (hours == 1)
			text = "eine Stunde";
		else
			text = hours + " Stunden";
		if (minutes > 0)
			text += " und ";
	}
	if (minutes == 1)
		text += "eine Minute";
	else if (minutes > 1)
		text += minutes + " Minuten";

	return text;
}


// Chart generation

function generateVoltageCircle(data, options = { series: [] }) {
	options.series = [ data.connection[ newestUpdateIdx(data)].voltage ];
    return options;
}


function generateVoltageLine(data, options = { series: [] }){
	options.series = [{
		name: "Batterie",
		data: []
	}];

	for (var i=0; i<data.connection.length; i++)
		options.series[0].data.push([data.connection[i].time*1000,data.connection[i].voltage]);

	return options;
}


function generateBar(data, start, end, options = {}) {
	options.colors = [];
	options.series = [{
		name: "Bearbeitungszeit",
		data: []
	}];

	var dataAcc = accumulateRange(data, start, end);

	for (var j=0; j<dataAcc.length; j++) {
		options.series[0].data.push({ x: dataAcc[j].x, y: dataAcc[j].y });
		options.colors.push(dataAcc[j].color);
	}

	return options;
}


function generateDaySum(data, start, end, options = { xaxis: {}}){
	options.series = [];
	options.colors = [];
	options.xaxis.min = start * 1000;
	options.xaxis.max = end * 1000;

	var untilDay = new Date(end * 1000);
	untilDay.setHours(23, 59, 59, 999);


	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}

		var curDay = new Date(start * 1000);
		curDay.setHours(0,0,0,0);

		var sum = 0;
		var dataArray = [];
		while (curDay < untilDay) {
			// calculate start and end time
			startTime = Math.floor(curDay.getTime() / 1000);

			curDay.setDate(curDay.getDate() + 1);
			endTime = Math.floor(curDay.getTime() / 1000);

			for (var j=0; j<data.series[i].data.length; j++) {
				var entry = data.series[i].data[j];
				if (startTime <= entry[1] && endTime >= entry[0]){
					sum += Math.min(entry[1], endTime) - Math.max(entry[0], startTime)
				}
			}

			dataArray.push([curDay.getTime(), sum/3600]);
		}

		options.series.push(
			{
				name: data.series[i].task,
				data: dataArray
			}
		);

		options.colors.push(data.series[i].color);
	}
	return options;
}


function generateWorkCircleHelper(data, options, begin, end, title, color, leave = 0){
	var min = new Date(minTime * 1000);
	if (begin < min)
		begin = min;
	var req = (getWorkDays(begin, end) - leave) * dailyWorkHours;
	var did = getWorkedHours(data, begin, end);

	options.series.push(did / req * 100);
	options.timetext.push(Math.round(did) + "h / " +  Math.round(req) + "h");
	options.labels.push(title);
	options.colors.push(color);
}


function generateWorkCircle(data, start, end, options = {}){
	options.colors = [];
	options.series = [];
	options.labels = [];
	options.timetext = [];

	var dateStart = new Date(start * 1000);
	var dateEnd = new Date(end * 1000);
	generateWorkCircleHelper(data, options, dateStart, dateEnd, "Zeitraum", '#222222');

	var dateNow = new Date();

	var weekBegin = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + (dateNow.getDay() == 0?-6:1)-dateNow.getDay());
	var weekEnd = new Date();
	weekEnd.setDate(weekBegin.getDate() + 7);
	generateWorkCircleHelper(data, options, weekBegin, weekEnd, "Woche", '#39539E');

	var monthBegin = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
	var monthEnd = new Date(dateNow.getFullYear(), dateNow.getMonth()+1, 0);
 	generateWorkCircleHelper(data, options, monthBegin, monthEnd, "Monat", '#0077B5');

	var yearBegin = new Date(dateNow.getFullYear(), 0, 1);
	var yearEnd =  new Date(dateNow.getFullYear() + 1, 0, 1);
	generateWorkCircleHelper(data, options, yearBegin, yearEnd, "Jahr", '#0084ff', annualLeave);

	return options;
}


function generateWeekHeatmap(data, start, end, series = NaN, options = { title: { style: {} }},  hourStep = 2){
	options.title.text = isNaN(series) ? "Gesamt" : data.series[series].task;
	options.title.style.color =  isNaN(series) ? "#222222" : data.series[series].color;
	options.colors = [ isNaN(series) ? "#222222" : data.series[series].color ];
	options.series = [];

	var result = [];

	for (var j=0; j < 24 / hourStep; j++) {
		var t = (j * hourStep);
		options.series[j] = {
			name: t + " – " + (t + hourStep) + " Uhr",
			data: [],
		};
		result[j] = [];
		for (var i=0; i < 7; i++)
			result[j][i]=0;
	}

	for (var i=0; i<data.series.length; i++) {
		if ((isNaN(series) && data.series[i].hide) || (!isNaN(series) && series != i))
			continue;
		console.log("match");
		for (var j = 0; j<data.series[i].data.length;j++){
			var e = data.series[i].data[j];
			if (e[1]  >= start && e[0]  <= end){
				var t = new Date(e[1] * 1000);
				var f = new Date(Math.max(e[0], start) * 1000);
				while(1) {
					var slot = Math.floor(f.getHours() / hourStep);
					var e = new Date(f.getFullYear(), f.getMonth(), f.getDate(), (slot + 1) * hourStep, 0, 0, 0);
					var dow = f.getDay();
					if (e > t){
						result[slot][dow] += t.getTime() - f.getTime();
						break;
					} else {
						result[slot][dow] += e.getTime() - f.getTime();
						f = e;
					}
				}
			}
		}
	}

	for (var j=0; j < 24 / hourStep; j++) {
		for (var i=0; i < 7; i++) {
			var d = (1 + i) % 7;
			options.series[j].data.push({
				x: weekdayName[d],
				y: (isNaN(result[j][d]) ? 0 : Math.round((result[j][d] / 3600000) * 100)/100),
			});
		}
	}

	console.log(start, end, series, data,options);
	return options;
}


function generateYearHeatmap(data, series = NaN,  options = { title: { style: {} } }){
	options.title.text = isNaN(series) ? "Gesamt" : data.series[series].task;
	options.title.style.color =  isNaN(series) ? "#222222" : data.series[series].color;
	options.colors = [ isNaN(series) ? "#222222" : data.series[series].color ];
	options.series = [];

	var result = [];
	var nowTime = Date.now();
	var now = new Date(nowTime);
	var start = new Date(nowTime);
	start.setHours(0,0,0,0);
	start.setFullYear(start.getFullYear()-1);
	var dayTime = 24*60*60*1000;
	var days = Math.ceil((now.getTime() - start.getTime()) / dayTime)

	for (var i=0; i<data.series.length; i++) {
		if ((isNaN(series) && data.series[i].hide) || (!isNaN(series) && series != i))
			continue;
		for (var j = 0; j<data.series[i].data.length;j++){
			var e = data.series[i].data[j];
			var t = new Date(e[1] * 1000);
			if (t > start.getTime()){
				var f = new Date(Math.max(e[0] * 1000, start.getTime()));
				while(1) {
					var e = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59, 1000);
					var d = Math.floor((e.getTime() - start.getTime()) / dayTime);
					if (isNaN(result[d]))
						result[d] = 0;
					if (e > t){
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

	for (var j=0; j < 7; j++) {
		options.series[(14 - j) % 7] = {
			name: weekdayName[j],
			data: [],
		};
	}
	for (var j=0; start < now; j++) {
		options.series[(8 - start.getDay())%7].data.push({
			x: "KW" + start.getWeekNumber()+ " " +start.getFullYear(),
			y: (isNaN(result[j]) ? 0 : Math.round((result[j] / 3600000) * 100)/100),
		});
		start.setDate(start.getDate() + 1);
	}

	return options;
}


function generateDayTimeBar(data, start, end, options = { xaxis: {} }) {
	options.series = [];
	options.xaxis.categories = [];
	options.colors = [];

	var untilDay = new Date(end * 1000);
	untilDay.setHours(23, 59, 59, 999);

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}

		var curDay = new Date(start * 1000);
		curDay.setHours(0,0,0,0);

		var dataArray = [];
		for (var day = 0; curDay < untilDay; day++) {
			// calculate start and end time
			startTime = Math.floor(curDay.getTime() / 1000);

			curDay.setDate(curDay.getDate() + 1);
			endTime = Math.floor(curDay.getTime() / 1000);

			dataArray.push(accumulateSeries(data.series[i], startTime, endTime));
		}

		options.series.push(
			{
				name: data.series[i].task,
				data: dataArray
			}
		);
		options.colors.push(data.series[i].color);
	}

	var curDay = new Date(start * 1000);
	curDay.setHours(12,0,0,0);
	for (var day = 0; curDay < untilDay; day++) {
		options.xaxis.categories.push(curDay.toISOString());
		curDay.setDate(curDay.getDate() + 1);
	}
	return options;
}


function generatePie(data, start, end, options = {}) {
	options.colors = [];
	options.series = [];
	options.labels = [];

	var dataAcc = accumulateRange(data, start, end);

	for (var j=0; j<dataAcc.length; j++) {
		options.labels.push(dataAcc[j].x);
		options.series.push(dataAcc[j].y);
		options.colors.push(dataAcc[j].color);
	}

	return options;
}
