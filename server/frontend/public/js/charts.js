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
	// chartOverviewTotal.updateOptions(generateDayTimeBar(data, startRange, endRange));
	// chartOverviewSum.updateOptions(generateDaySum(data, startRange, endRange));
	// chartWeekHeatMap.updateOptions(generateWeekHeatmap(data, startRange, endRange));
	// chartSumBar.updateOptions(generateBar(data, startRange, endRange));
}

function setOverviewTotalStackType(type){
	switch(type){
		case 'percent':
			chartOverviewTotal.updateOptions({
				chart: {
					stacked: true,
					stackType: '100%'
				},
				yaxis: {
					max: 100,
					labels: {
						formatter: formatPercent,
					},
				}
			});
			break;
		case 'single':
			chartOverviewTotal.updateOptions({
				chart: {
					stacked: false,
					stackType: 'normal'
				},
				yaxis: {
					max: function(max) { return max },
					labels: {
						formatter: formatHourShort,
					},
				}
			});
			break;
		case 'stacked':
		default:
			chartOverviewTotal.updateOptions({
				chart: {
					stacked: true,
					stackType: 'normal'
				},
				yaxis: {
					max: 24,
					labels: {
						formatter: formatHourShort,
					},
				}
			});
			break;
	}
}

function setOverviewSumStackType(type){
	switch(type){
		case 'single':
			chartOverviewSum.updateOptions({
				chart: {
					type: 'line',
					stacked: false,
				},
			});
			break;
		case 'stacked':
		default:
			chartOverviewSum.updateOptions({
				chart: {
					type: 'area',
					stacked: true,
				},
			});
			break;
	}
}

function updateCatWeekHeatmap(series){
	chartWeekHeatMap.updateOptions(generateWeekHeatmap(data, startRange, endRange, series));
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

	$('#week-heatmap-dropdown-set').append(
		'<a class="dropdown-item" href="javascript:updateCatWeekHeatmap(' + series + ');"><span style="color:' + data.series[series].color  + ';">⬤</span>&nbsp;' + data.series[series].task + '</a>'
	);
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

$('#week-heatmap-dropdown-set').append('<div class="dropdown-divider"></div><a class="dropdown-item" href="javascript:updateCatWeekHeatmap(NaN);"><b>Gesamt</b></a>');
$('#year-heatmap-dropdown-set').append('<div class="dropdown-divider"></div><a class="dropdown-item" href="javascript:updateCatYearHeatmap(NaN);"><b>Gesamt</b></a>');


var chartOverviewTotal = renderChart("chart-overview-total", generateDayTimeBar(data, startRange, endRange, {
	chart: {
		height: 350,
		type: 'bar',
		stacked: true,
		stackType: 'normal',
		toolbar: {
			show: true,
			tools: {
				download: false,
			}
		},
		zoom: {
			enabled: true
		},
	},
	plotOptions: {
		bar: {
			horizontal: false,
			endingShape: 'flat',
			distributed: false,
		},
	},
	yaxis: {
		max: 24,
		labels: {
			formatter: formatHourShort,
		},
	},
	xaxis: {
		type: 'datetime',
		min: minTime * 1000,
		max: maxTime * 1000,
		labels: {
			datetimeFormatter: {
				year: 'yyyy',
				month: 'MMMM \'yy',
				day: 'dd. MMMM',
				hour: 'HH:mm'
			}
		}
	},
	dataLabels: {
		enabled: false,
	},
	legend: {
		position: 'top',
	},
	tooltip: {
		x: {
			format: 'd. MMMM yyyy',
		},
	}
}));

var chartOverviewSum = renderChart("chart-overview-sum", generateDaySum(data, startRange, endRange,  {
	chart: {
		type: 'line',
		stacked: false,
		height: 350,
		toolbar: {
			show: true,
			tools: {
				download: false,
			}
		},
		zoom: {
			enabled: true
		},
	},
	plotOptions: {
		line: {
			curve: 'smooth',
		}
	},
	dataLabels: {
		enabled: false
	},

	yaxis: {
		labels: {
		  formatter: formatHourShort
		},
	},
	xaxis: {
		type: 'datetime',
		labels: {
			rotate: -30,
			datetimeFormatter: {
				year: 'yyyy',
				month: 'MMMM \'yy',
				day: 'dd. MMMM',
				hour: 'HH:mm'
			}
		}
	},
	tooltip: {
		shared: true,
		y: {
			formatter: formatHourShort,
		}
	},
	legend: {
		position: 'top',
	}
}));

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
var chartWeekHeatMap = renderChart("chart-week-heatmap", generateWeekHeatmap(data, startRange, endRange, NaN, {
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
			formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
				return Math.round(value / w.globals.seriesTotals.reduce((a, b) => { return a + b }, 0) * 100) + "%";
			}
		},
	},
	yaxis: {
		reversed: true,
	}
}));

var chartSumBar = renderChart("chart-sum-bar", generateBar(data, startRange, endRange, {
	chart: {
		height: 350,
		type: 'bar',
		toolbar: {
			show: false
		}
	},
	colors: [],
	plotOptions: {
		bar: {
			distributed: true,
			horizontal: true,
		},
	},
	dataLabels: {
		enabled: true,
		formatter: formatHour,
	},
	xaxis : {
		title : {
			text : "Stunden"
		},
	},
	tooltip: {
		y: {
			formatter: formatHourMinute,
		},
	}
}));

services.dateRange.getDateRange().subscribe(dateRange => {
	refreshCharts(dateRange.start.unix(), dateRange.end.unix());
});
