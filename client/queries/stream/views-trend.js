/* global Keen, keen_project, keen_read_key */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var trendLineChartQuery = new Keen.Query("count", {
		eventCollection: "dwell",
		filters: [
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"stream"}
		],
		interval: "daily",
		targetProperty: "time.day",
		timeframe: queryParameters.timeframe || "previous_14_days",
		timezone: "UTC",
		maxAge:10800
});

client.draw(trendLineChartQuery, document.getElementById("trend-linechart"), {
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
