var colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"];
	
function renderVoltage(data, graph, size=190) {
	
	var idx = newestUpdateIdx(data);
	var newestVoltage = data.connection[idx].voltage;

    var voltageOptions = {
      chart: {
        height: size,
        width: size,
        type: 'radialBar',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
           hollow: {
            margin: 0,
            size: '60%',
            background: '#fff',
            image: undefined,
            imageOffsetX: 0,
            imageOffsetY: 0,
            position: 'front',
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: '#fff',
            strokeWidth: '67%',
            margin: 0, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },

          dataLabels: {
            showOn: 'always',
            name: {
              offsetY: -10,
              show: true,
              color: '#888',
              fontSize: '15px'
            },
            value: {
              formatter: function(val) {
                return parseInt(val) + "%";
              },
			  offsetY: 0,
              color: '#111',
              fontSize: '18px',
              show: true,
            }
          }
        }
      },
      series: [ newestVoltage ],
      stroke: {
        lineCap: 'round'
      },
      labels: ['Batterie'],

    };

    var voltageChart = new ApexCharts(
      document.querySelector("#" + graph),
      voltageOptions
    );
    voltageChart.render();

}

function renderBar(data, graph, option) {
		// option: month, week, year
		if (option === "month") {
			var dataAcc = accumulateLastMonth(data);
			var title = "Zeitverbrauch letzte 30 Tage";
		} else if (option === "week") {
			var dataAcc = accumulateLastWeek(data);
			var title = "Zeitverbrauch letzte 7 Tage";
		} else if (option === "thisyear") {
			var dataAcc = accumulateThisYear(data);
			var title = "Zeitverbrauch " + new Date().getFullYear();
		} else {
			// invalid option
			return null;
		}

		var options = {
			chart: {
				height: 350,
				type: 'bar',
				toolbar: {
					show: false
				}
			},
			colors : colors,
			plotOptions: {
				bar: {
					horizontal: true
				},
			},
			dataLabels: {
				enabled: true,
			}, 
			title : {
				text : title,
				align : "middle"
			},
			series : [{
				name : "Zeit",
				data : dataAcc
			}],
			xaxis : {
				title : {
					text : "Stunden"
				}
			},
		}

		var chart = new ApexCharts(
			document.querySelector("#" + graph),
			options
		);

		chart.render();
}

function renderHeatmap(data, graph, option) {
	var colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"];
	colors.reverse();

	if (option == "week") {
		var dataAcc = heatmap_week(data);
	} else {
		return null;
	}

    var options = {
        chart: {
            height: 300,
            type: 'heatmap',
    		toolbar: {
	          show: false
    		}
        },
        dataLabels: {
            enabled: false
        },
        colors: colors,
        series: dataAcc.data,
        xaxis: {
            type: 'category',
            categories: dataAcc.categories
        },
        grid: {
            padding: {
                right: 20
            }
        }
    }

    var chart = new ApexCharts(
        document.querySelector("#" + graph),
        options
    );

    chart.render();
}

function generateWorkCircle(data){
	var options = {
		chart: {
			height: 350,
			type: 'radialBar',
		},
		plotOptions: {
			radialBar: {
				offsetY: -10,
				startAngle: 0,
				endAngle: 270,
				hollow: {
					margin: 5,
					size: '30%',
					background: 'transparent',
					image: undefined,
				},
				dataLabels: {
					name: {
						show: false,
						
					},
					value: {
						show: false,
					}
				}
			}
		},
		colors: ['#0084ff', '#39539E', '#0077B5'],
		series: [67,61,290],
		labels: ['Jahr', 'Monat', 'Woche'],
		legend: {
			show: true,
			floating: true,
			fontSize: '16px',
			position: 'left',
			offsetX: 60,
			offsetY: 10,
			labels: {
				useSeriesColors: true,
			},
			markers: {
				size: 0
			},
			formatter: function(seriesName, opts) {
				return seriesName + ": " + Math.round(opts.w.globals.series[opts.seriesIndex] / 90 * 100) + "%";
			},
			itemMargin: {
				horizontal: 1,
			}
		},
	};
	var now = new Date();
	console.log(getWorkingTimePercent(data, new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear() + 1,0,1)));
	
	return options;
}


function generateWeekHeatmap(data, since, limit = NaN, hourStep = 2){
	var options = {
		chart: {
			height: 350,
			type: 'heatmap',
		},
		dataLabels: {
			enabled: false
		},
		colors: ["#008FFB"], //todo: je nach limit
		series: [],
		title: {
			text: 'HeatMap Chart (Single color)'
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
	};

	var result = [];
	var nowTime = Date.now();
	var now = new Date(nowTime);
	var start =  new Date(since);

	for (var j=0; j < 24 / hourStep; j++) {
		options.series[j] = {
			name: (j * hourStep) + " Uhr",
			data: [],
		};
		result[j] = [];
		for (var i=0; i < 7; i++)
			result[j][i]=0;
	}

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide || (!isNaN(limit) && limit != data.series[i].side))
			continue;
		for (var j = 0; j<data.series[i].data.length;j++){
			var e = data.series[i].data[j];
			var t = new Date(e[1] * 1000);
			if (t > start.getTime()){
				var f = new Date(Math.max(e[0] * 1000, start.getTime()));
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
	
	console.log(result);
	return options;
}


function generateYearHeatmap(data, limit = NaN){
	var options = {
		chart: {
			height: 350,
			type: 'heatmap',
		},
		dataLabels: {
			enabled: false
		},
		colors: ["#008FFB"],
		series: [],
		title: {
			text: 'HeatMap Chart (Single color)'
		},
		tooltip: {
			y: {
				formatter: formatHour,
			},
			x: {
				show: true,
			},
		}
	};

	var result = [];
	var nowTime = Date.now();
	var now = new Date(nowTime);
	var start =  new Date(nowTime);
	start.setHours(0,0,0,0);
	start.setFullYear(start.getFullYear()-1);
	var dayTime = 24*60*60*1000;
	var days = Math.ceil((now.getTime() - start.getTime()) / dayTime)

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide || (!isNaN(limit) && limit != data.series[i].side))
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

function generateVoltageLine(data, since){
	var options = {
		chart: {
			type: 'area',
			width: 200,
			height: 75,
			sparkline: {
				enabled: true
			}
		},
		series: [{
			name: "Batterie",
			data: []
		}],
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
	};
	var sinceTime = new Date(since).getTime() / 1000;
	for (var i=0; i<data.connection.length; i++)
		if (data.connection[i].time >= sinceTime)
			options.series[0].data.push([data.connection[i].time*1000,data.connection[i].voltage]);
	return options;
}
function generateDayTimeBar(data, start, end, height=350) {

	var options = {
		chart: {
			height: height,
			type: 'bar',
			stacked: true,
			toolbar: {
				show: true
			},
			zoom: {
				enabled: true
			},
			dropShadow: {
				enabled: true,
				top: -2,
				left: 2,
			},
		},
		plotOptions: {
			bar: {
				horizontal: false,
				endingShape: 'flat',
				distributed: false,
			},
		},
		series: [],
		yaxis: {
			max: 24,
			labels: {
				formatter: formatHourShort,
			},
		},
		xaxis: {
			type: 'datetime',
			categories: [],
			labels: {
				datetimeFormatter: {
					year: 'yyyy',
					month: 'MMMM \'yy',
					day: 'dd. MMMM',
					hour: 'HH:mm'
				}
			}
		},
		colors : colors,
		dataLabels: {
			enabled: false,
		},
		legend: {
			position: 'right',
			formatter: formatHourLabel,
		},
		tooltip: {
			x: {
				format: 'd. MMMM yyyy',
			},
		}
	}

	var untilDay = new Date(end);
	untilDay.setHours(23, 59, 59, 999);

	for (var i=0; i<data.series.length; i++) {
		if (data.series[i].hide) {
			continue;
		}
		
		var curDay = new Date(start);
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
				data: dataArray,
				color : colors[i]
			}
		);
	}

	var curDay = new Date(start);
	curDay.setHours(12,0,0,0);
	for (var day = 0; curDay < untilDay; day++) { 
		options.xaxis.categories.push(curDay.toISOString());
		curDay.setDate(curDay.getDate() + 1);
	}

	return options;
}

function generatePie(data, start, end, width=500) {
	var options = {
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
			width: width,
			type: 'donut',
		},
		fill: {
			type: 'gradient',
			gradient: {
				shade: 'dark',
			},
		},
		legend: {
			formatter: formatHourLabel,
		},
		name : {
			show: true,
		},
		colors : colors,
		title : {
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
		series: [],
		labels: [],
	}

	var dataAcc = accumulateRange(data, Math.floor(new Date(start).getTime() / 1000), Math.floor(new Date(end).getTime() / 1000));

	for (var j=0; j<dataAcc.length; j++) {
		options.labels.push(dataAcc[j].x);
		options.series.push(dataAcc[j].y);
	}

	return options;
}

