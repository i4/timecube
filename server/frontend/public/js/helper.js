// Header
if (data.name != "") {
	document.getElementById("header").innerHTML = "<i class=\"fas fa-cube\"></i> " + data.name;
}

services.cube.setCubes(data.cube);
services.series.setSeries(data.series);