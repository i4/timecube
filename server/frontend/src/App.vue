<template>
	<div id="app">
		<dashboard />
	</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Dashboard from "./components/Dashboard.vue";

@Component({
	components: {
		Dashboard
	}
})
export default class App extends Vue {}
</script>

<style>
</style>
