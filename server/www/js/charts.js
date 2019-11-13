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
		refreshCharts();
	}
}

function refreshCharts(){
	chartOverviewTotal.updateOptions(generateDayTimeBar(data, startRange, endRange));
	chartOverviewSum.updateOptions(generateDaySum(data, startRange, endRange));
	chartSummary.updateOptions(generateWorkCircle(data, startRange, endRange));
	chartWeekHeatMap.updateOptions(generateWeekHeatmap(data, startRange, endRange));
	chartSumPie.updateOptions(generatePie(data, startRange, endRange));
	chartSumBar.updateOptions(generateBar(data, startRange, endRange));
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
var minTime = NaN;
var maxTime = NaN;
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

	$('#categories').append(
		'<div class="category">' +
			'<input type="checkbox" ' + (data.series[series].hide ? "" : "checked") + ' name="cat-' + series + '" id="cat-' + series + '" value="1" onchange="updateCat(' + series + ')">' +
			'<label for="cat-' + series + '" style="background-color:' + data.series[series].color  + ';"></label>' +
			'<div class="icon"><span class="fas ' + data.series[series].icon + '"></span></div>' +
			'<a class="label disabled">' + data.series[series].task + '</a>' +
			'&nbsp;<span class="duration">(gesamt ' + Math.round(sum / 3600) + ' h)</span>' +
		'</div>'
	);

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

// Würfelinformationen
for (var cube in data['cube']) {
	if(data.cube[cube].connection.length === 0) {
		console.warn("Found empty cube, skipping...");
		continue;
	}

	$('#cubes').append(
		'<div class="cube">' +
			'<div class="cubeid">' + data.cube[cube].id + ' Update ' + lastUpdate(data.cube[cube]) + '</div>' +
			'<div class="inline" id="voltagecurr-' + data.cube[cube].id + '"></div>' +
			'<div class="inline" id="voltagehist-' + data.cube[cube].id + '"></div>' +
		'</div>'
	);
	renderChart("voltagecurr-" + data.cube[cube].id, generateVoltageCircle(data.cube[cube], {
		chart: {
			height: 190,
			width: 100,
			type: 'radialBar',
			toolbar: {
				show: false
			}
		},
		plotOptions: {
			radialBar: {
				startAngle: 0,
				endAngle: 360,
				dataLabels: {
					showOn: 'always',
					name: {
					  offsetY: -8,
					  show: true,
					  fontSize: '12px',
					  color: '#888',
					},
					value: {
					  formatter: formatPercent,
					  offsetY: -3,
					  color: '#111',
					  fontSize: '16px',
					  show: true,
					}
				}
			},
		},
		stroke: {
			lineCap: 'round'
		},
		labels: ['Batterie'],
	}));
	renderChart("voltagehist-" + data.cube[cube].id, generateVoltageLine(data.cube[cube], {
		chart: {
			type: 'area',
			width: 300,
			height: 100,
			sparkline: {
				enabled: true
			}
		},
		dataLabels: {
			enabled: false
		},
		grid: {
			padding: {
				top: 10,
				bottom: 10,
			}
		},
		series: [],
		xaxis: {
			type: 'datetime',
		},
		tooltip: {
			marker: {
				show: false
			},
			x: {
				format: 'd. MMMM yyyy, HH:mm',
			},
			y: {
				formatter: formatPercent,
			}
		}
	}));
}
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

var chartSummary = renderChart("chart-work", generateWorkCircle(data, startRange, endRange, {
	chart: {
		width: 350,
		height: 300,
		type: 'radialBar',
	},
	plotOptions: {
		radialBar: {
			size: 150,
			inverseOrder: true,
			startAngle: -180,
			offsetX: -40,
			endAngle: 90,
			hollow :{
				size: "30%",
			},
			track: {
				show: true,
				margin: 10,
			},

			dataLabels: {
				value: {
					formatter: function(val) {
						return Math.round(val) + "%";
					},
				},
				total: {
					show: false,
				},
			},
		},
	},
	stroke: {
		lineCap: 'round',
	},
	legend: {
		show: true,
		floating: true,
		position: 'left',
		offsetX: 110,
		offsetY: 173,
		labels: {
			useSeriesColors: true,
		},
		markers: {
			width: 0,
			height: 0,
		},
		formatter: function(seriesName, opts) {
			return seriesName + ": " + opts.w.config.timetext[opts.seriesIndex];
		},
		itemMargin: {
			horizontal: 0,
		}
	},
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

var chartSumPie = renderChart("chart-sum-pie", generatePie(data, startRange, endRange, {
	plotOptions: {
		pie: {
			donut: {
				labels: {
					show: true,
					name: {
						show:true,
					},
					value: {
						show:true,
						formatter: formatHourShort,
					},
					total : {
						show:true,
						label: 'Gesamt',
						color: '#111',
						formatter: formatTotalHourShort,
					}
				}
			}
		}
	},
	chart: {
		height: 350,
		type: 'donut',
	},
	legend: {
		show: false
	},
	name : {
		show: true,
	},
	title: {
		align : "left",
	},
	yaxis: {
		labels: {
			formatter: formatHour,
		},
	},
	dataLabels: {
		enabled: true,
		formatter: formatPercent,
	},
	colors: [],
	series: [],
	labels: [],
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


function daterangeCallback(startRangeMoment, endRangeMoment) {
	$('#reportrange span').html(startRangeMoment.format('D. MMMM YYYY') + ' — ' + endRangeMoment.format('D. MMMM YYYY'));
}

var pickerRanges = {
	'Alles' : [startRangeMoment, endRangeMoment],
	'Vergangene 30 Tage': [moment().subtract(29, 'days'), moment()],
	'Vergangene 7 Tage': [moment().subtract(6, 'days'), moment()],
	'Letzte Woche': [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
	'Diese Woche': [moment().startOf('week'), moment().endOf('week')],
	'Letzter Monat': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
	'Dieser Monat': [moment().startOf('month'), moment().endOf('month')],
	'Letztes Jahr': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
	'Dieses Jahr': [moment().startOf('year'), moment().endOf('year')],
};
for (var year = new Date(minTime * 1000).getFullYear() - 1; year <= new Date().getFullYear(); year++ ){
	var y = year % 100;
	pickerRanges["SoSe " + y] = [moment(year + "-04-01T00:00:00"), moment(year + "-10-01T00:00:00")]
	pickerRanges["WiSe " + y + '/' + (y + 1)] = [moment(year + "-10-01T00:00:00"), moment((year + 1) + "-04-01T00:00:00")]
}

$('#reportrange').daterangepicker({
	"showDropdowns": true,
	"showWeekNumbers": true,
	"timePicker": true,
	"timePicker24Hour": true,
	ranges: pickerRanges,
	"locale": {
		"format": "YYYY-MM-DD",
		"separator": " — ",
		"applyLabel": "Auswählen",
		"cancelLabel": "Abbrechen",
		"fromLabel": "Von",
		"toLabel": "Bis",
		"customRangeLabel": "Datumsauswahl",
		"weekLabel": "W",
		"daysOfWeek": weekdayShort,
		"monthNames": monthName,
		"firstDay": 1
	},
	"alwaysShowCalendars": false,
	"minDate": moment.unix(minTime),
	"maxDate": moment(),
	"startDate": startRangeMoment,
	"endDate": endRangeMoment
}, function(start, end, label) {
	startRangeMoment = start;
	startRange = start.unix();
	endRangeMoment = end;
	endRange = end.unix();
	if (label != "Datumsauswahl")
		$('#reportrange span').html(label + ' (' + startRangeMoment.format('D. MMMM YYYY') + ' — ' + endRangeMoment.format('D. MMMM YYYY') +')');
	else
		$('#reportrange span').html(startRangeMoment.format('D. MMMM YYYY') + ' — ' + endRangeMoment.format('D. MMMM YYYY'));
	refreshCharts();
});

daterangeCallback(startRangeMoment, endRangeMoment);
