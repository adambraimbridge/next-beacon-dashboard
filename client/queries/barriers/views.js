/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

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
