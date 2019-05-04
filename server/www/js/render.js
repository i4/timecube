var colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"];
	
function renderVoltage(data, graph, size=200) {
	
	var idx = newestUpdateIdx(data);
	var newestVoltage = data.connection[idx].voltage;

    var voltageOptions = {
      chart: {
        height: size,
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
            size: '70%',
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

function generatePie(data, start, end, width=400) {
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
							color: '#000',
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

