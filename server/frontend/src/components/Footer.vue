<template>
	<footer class="container text-center">
		<p class="text-muted credit">
			<a href="https://gitlab.cs.fau.de/i4/timecube">
				i4
				<i class="fas fa-cube"></i>timecube
			</a> &copy; 2019 Laura Lawniczak, Bernhard Heinloth &amp; Christian Eichler
		</p>
	</footer>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Footer extends Vue {}
</script>

<style scoped>
.credit {
	font-size: 0.7em;
	padding: 20px;
}
</style>
