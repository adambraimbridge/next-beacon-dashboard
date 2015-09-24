/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var optOutMetric = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Percentage of users opted-in via akamai who then opt-out")
	.el(document.getElementById("optOuts"))
	.chartType("metric")
	.prepare();

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


var anonOptOuts = new Keen.Query("funnel", {
	steps : [
		{
			eventCollection: 'optin',
			filters: [
				{"operator":"exists","property_name":"meta.anon","property_value":true},
				{"operator":"eq","property_name":"meta.type","property_value":"in"}
			],
			timeframe: queryParameters.timeframe || "this_14_days",
			timezone: "UTC",
			actorProperty : 'user.device_id'
		},
		{
			eventCollection: 'optin',
			filters: [
				{"operator":"eq","property_name":"meta.type","property_value":"out"}
			],
			timeframe: queryParameters.timeframe || "this_14_days",
			timezone: "UTC",
			actorProperty : 'user.device_id'
		}
	],

});

client.draw(counts, document.getElementById("trend"), {
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

client.draw(counts, document.getElementById("dailyTotals"), {
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
	title: 'Anons by referrer',
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

client.run(anonOptOuts, function(err, response){
	if(err){
		console.error(err);
		return;
	}

	var percentage = Math.ceil((response.result[1] / response.result[0]) * 100);
	optOutMetric.parseRawData({result:percentage}).render();
});
