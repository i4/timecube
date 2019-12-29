// Header
if (data.name != "") {
	document.getElementById("header").innerHTML = "<i class=\"fas fa-cube\"></i> " + data.name;
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

function updateCat(series){
	if (data['series'][series].hide == document.getElementById('cat-' + series).checked){
		data['series'][series].hide = !document.getElementById('cat-' + series).checked;
		// refreshCharts();
	}
}

function refreshCharts(startRange, endRange){
}

function updateCatYearHeatmap(series){
	chartYearHeatMap.updateOptions(generateYearHeatmap(data, series));
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

	$('#year-heatmap-dropdown-set').append(
		'<a class="dropdown-item" href="javascript:updateCatYearHeatmap(' + series + ');"><span style="color:' + data.series[series].color  + ';">⬤</span>&nbsp;' + data.series[series].task + '</a>'
	);
}

moment.locale('de');
var startRangeMoment = moment.max(moment.unix(minTime), moment.unix(maxTime).subtract(1, 'year'));
var startRange = startRangeMoment.unix();
var endRange = maxTime;
var endRangeMoment = moment.unix(endRange);

services.cube.setCubes(data.cube);
services.series.setSeries(data.series);

$('#year-heatmap-dropdown-set').append('<div class="dropdown-divider"></div><a class="dropdown-item" href="javascript:updateCatYearHeatmap(NaN);"><b>Gesamt</b></a>');

var chartYearHeatMap = renderChart("chart-year-heatmap",  generateYearHeatmap(data, NaN, {
	chart: {
		height: 350,
		type: 'heatmap',
		toolbar: {
			show: false,
		},
	},
	title: {
		align: 'center',
		floating: true,
		style: {}
	},
	dataLabels: {
		enabled: false
	},

	tooltip: {
		y: {
			formatter: formatHour,
		},
		x: {
			show: true,
		},
	}
}));

services.dateRange.getDateRange().subscribe(dateRange => {
	refreshCharts(dateRange.start.unix(), dateRange.end.unix());
});
