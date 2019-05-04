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
			data : values
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
	return weekday(date.getDay()) + ", " + date.getDate() + "."
				+ date.getMonth() + "." + date.getFullYear() + " "
				+ date.getHours() + ":" + date.getMinutes() + ":"
				+ date.getSeconds() + " Uhr";
				
}

function accumulateRange(data, start, end) {
	var result = [];

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}

		var sum = 0;
		for (var j=0; j<data.series[i].data.length; j++) {
			var entry = data.series[i].data[j];
			// entry completely in range
			if (entry[0] >= start && entry[1] <= end) {
				sum += entry[1] - entry[0];
			} // entry at the beginning of range
			else if (entry[0] <= start && entry[1] >= start) {
				sum += entry[1] - start;
			} // entry at the end of range
			else if (entry[0] <= end && entry[1] >= end) {
				sum += end - entry[0];
			}
		}

		result.push({
					x: data.series[i].task,
					// We want the result in hours, not seconds
					y: Math.round((sum / 3600) * 100)/100
					});
	}
	result.sort(function(a,b) { return b.y - a.y} );

	return result;
}

