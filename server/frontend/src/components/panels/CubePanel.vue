<template>
	<div class="card">
		<div id="cubes" class="card-body">
			<a class="card-title">Würfel</a>
			<div class="cube" v-for="cube in cubes" :key="cube.id">
				<div class="cubeid">{{ cube.id }} Update {{ lastUpdate(cube) }}</div>
				<VueApexCharts
					class="inline"
					width="100"
					height="190"
					type="radialBar"
					:options="voltageOptions()"
					:series="[ lastVoltage(cube) ]"
				></VueApexCharts>
				<VueApexCharts
					class="inline"
					width="300"
					height="100"
					type="area"
					:options="voltageLineOptions()"
					:series="generateVoltageLine(cube)"
				></VueApexCharts>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Cube } from "@/model/cube";
import { Connection } from "@/model/connection";
import VueApexCharts from "vue-apexcharts";
import { services } from "@/main";
import { CubeService } from "@/services/CubeService";
import { tap } from "rxjs/operators";
import * as moment from "moment";

@Component({
	components: {
		VueApexCharts
	}
})
export default class CubePanel extends Vue {
	private cubes: Cube[] = [];

	created() {
		services.cube.getCubes().subscribe(cubes => (this.cubes = cubes));
	}

	voltageOptions() {
		return {
			chart: {
				height: 190,
				width: 100,
				type: "radialBar",
				toolbar: {
					show: false
				}
			},
			plotOptions: {
				radialBar: {
					startAngle: 0,
					endAngle: 360,
					dataLabels: {
						showOn: "always",
						name: {
							offsetY: -8,
							show: true,
							fontSize: "12px",
							color: "#888"
						},
						value: {
							formatter: this.formatPercent,
							offsetY: -3,
							color: "#111",
							fontSize: "16px",
							show: true
						}
					}
				}
			},
			stroke: {
				lineCap: "round"
			},
			labels: ["Batterie"]
		};
	}

	voltageLineOptions() {
		return {
			chart: {
				type: "area",
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
					bottom: 10
				}
			},
			xaxis: {
				type: "datetime"
			},
			tooltip: {
				marker: {
					show: false
				},
				x: {
					format: "d. MMMM yyyy, HH:mm"
				},
				y: {
					formatter: this.formatPercent
				}
			}
		};
	}

	formatPercent(val: number): string {
		return Math.round(val) + "%";
	}

	lastVoltage(cube: Cube): number {
		if (cube.connection.length === 0) {
			return 0;
		}
		return cube.connection.reduce((a, b) => (a.time > b.time ? a : b))
			.voltage;
	}

	lastUpdate(cube: Cube): string {
		let times = cube.connection.map(connection => connection.time);
		if (times.length === 0) {
			return "never";
		}
		return moment(Math.max(...times) * 1000).format("LLLL");
	}

	generateVoltageLine(cube: Cube) {
		return [
			{
				name: "Batterie",
				data: cube.connection.map((connection: Connection) => [
					connection.time * 1000,
					connection.voltage
				])
			}
		];
	}
}
</script>