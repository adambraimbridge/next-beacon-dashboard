/* global Keen, keen_project, keen_read_key */

"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var counts = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	filters: [
		{"operator":"exists","property_name":"user.uuid","property_value":false},
		{"operator":"exists","property_name":"meta.sessionServiceDown","property_value":false}
	],
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	interval: queryParameters.interval || "daily",
	timezone: "UTC"
});

var referrers = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	filters: [
		{"operator":"exists","property_name":"user.uuid","property_value":false},
		{"operator":"not_contains","property_name":"page.referrer.hostname","property_value":"ft.com"},
		{"operator":"exists","property_name":"meta.sessionServiceDown","property_value":false}
	],
	groupBy: "page.referrer.hostname",
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

client.draw(counts, document.getElementById("linechart"), {
	chartType: "linechart",
	title: 'Approximate Trend Over Time',
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

client.draw(counts, document.getElementById("columnchart"), {
	chartType: "columnchart",
	title: 'Daily Totals in Real Numbers',
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


client.draw(referrers, document.getElementById("referrers"), {
	chartType: "piechart",
	title: 'Where Do They Come From?',
	chartOptions : {
		height: 450,
		colors : [
			'#c00d00',
			'#002758',
			'#410057,',
			'#27757b',
			'#333333',
			'#f99d9d',
			'#2bbbbf',
			'#f3dee3'
		]
	}
});
