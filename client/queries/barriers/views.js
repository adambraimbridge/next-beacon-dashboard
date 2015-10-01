/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var barriersRendered = new Keen.Query("count_unique", {
	eventCollection: "barrier",
	groupBy: "meta.type",
	interval: "daily",
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var barrierTypes = new Keen.Query("count", {
	eventCollection: "barrier",
	filters: [
		{"operator":"eq","property_name":"meta.type","property_value":"shown"},
		{"operator":"exists","property_name":"meta.barrierType","property_value":true}],
	groupBy: "meta.barrierType",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

client.draw(barriersRendered, document.getElementById("barriersRendered"), {
	chartType: "areachart",
	title: 'Compared with "first click free" and failed barrier attempts',
	chartOptions: {
		height: 450,
		chartArea: {
			left: '10%',
			width: '75%'
		}
	}
});

client.draw(barrierTypes, document.getElementById("barrierTypes"), {
	chartType: "piechart",
	title: 'Percentage of users seeing which barrier types',
	chartOptions: {
		height: 450,
		chartArea: {
			left: '10%',
			width: '75%'
		}
	}
});

client.run(barriersRendered, function(err, result){
	console.log(result);
});
