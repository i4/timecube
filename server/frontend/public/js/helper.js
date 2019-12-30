// Helper
Date.prototype.getWeekNumber = function(){
	var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	var dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
	return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};


// Header
if (data.name != "") {
	document.getElementById("header").innerHTML = "<i class=\"fas fa-cube\"></i> " + data.name;
}

// Kategorien
window.minTime = NaN;
window.maxTime = NaN;
for (var series in data['series']) {
	var sum = 0;
	for (var j=0; j<data.series[series].data.length; j++) {
		var f = data.series[series].data[j][0];
		var t = data.series[series].data[j][1];
		if (f >= t){
			// Remove invalid entries
			data.series[series].data.splice(j, 1);
		} else {
			if (isNaN(minTime) || minTime > f)
				minTime = f;
			if (isNaN(maxTime) || maxTime < t)
				maxTime = t;

			sum += t - f;
		}
	}
}

moment.locale('de');
var startRangeMoment = moment.max(moment.unix(minTime), moment.unix(maxTime).subtract(1, 'year'));
var startRange = startRangeMoment.unix();
var endRange = maxTime;
var endRangeMoment = moment.unix(endRange);

services.cube.setCubes(data.cube);
services.series.setSeries(data.series);