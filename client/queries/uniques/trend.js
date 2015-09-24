/* global Keen, keen_project, keen_read_key */

"use strict";

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	timeframe: queryParameters.timeframe || "this_14_days",
	interval: queryParameters.interval || "daily",
	targetProperty: "user.uuid",
	timezone: "UTC",
	maxAge: 10800
});

client.draw(query, document.getElementById("linechart"), {
	chartType: "linechart",
	title: 'Approximate trend over time',
	chartOptions: {
		height: 450,
		trendlines: {
			0: {
				color: 'green',
				type: 'polynomial',
				degree: 6
			}
		},
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

client.draw(query, document.getElementById("columnchart"), {
	chartType: "columnchart",
	title: 'Daily totals in real numbers',
	chartOptions: {
		height: 450,
		trendlines: {
			0: {
				color: 'green',
				type: 'polynomial',
				degree: 6
			}
		},
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	}
});
