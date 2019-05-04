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

function renderPie(data, graph_prefix, width=300) {
	var colors = ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#00D9E9"];

	var dataAcc = pie_accumulateLastWeek(data);

	console.log(dataAcc);

	for (var i=0; i<7; i++) {
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
			},
			name : {
				show: true,
			},
			colors: colors,
			labels : dataAcc[i].labels,
			series : dataAcc[i].data,
			title : {
				text : dataAcc[i].day,
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
		}
		var chart = new ApexCharts(
			document.querySelector("#" + graph_prefix + (7-i)),
			options
		);
	
		chart.render()
	}
}

