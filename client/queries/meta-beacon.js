/* global Keen, keen_project, keen_read_key */

"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var linechartQuery = new Keen.Query("count_unique", {
	eventCollection: "beacon-dashboard",
	interval: "daily",
	targetProperty: "user.uuid",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC",
	maxAge: 10800
});

client.draw(linechartQuery, document.getElementById("linechart"), {
	chartType: "linechart",
	title: 'Approximate trend over time',
	chartOptions: {
		height: 450,
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	}
});
