/* global Keen, keen_project, keen_read_key */

"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = require('../lib/wrapped-keen');

// Approximate trend over time
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

// Unique user count, broken down by dashboard
var table = new Keen.Dataviz()
	.el(document.getElementById("table"))
	.chartType("table")
	.chartOptions({
		width:"100%",
		height:"500",
		sortAscending:false,
		sortColumn:1
	})
	.prepare();

var tableQuery = new Keen.Query("count_unique", {
	eventCollection: "beacon-dashboard",
	groupBy: "page.article_id",
	targetProperty: "user.uuid",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC",
	filters: [{
		"property_name":"page.article_id",
		"operator":"contains",
		"property_value":"beacon"
	},
	{
		"property_name":"page.original_url",
		"operator":"not_contains",
		"property_value":"token="
	}],
	maxAge: 10800
});

client.run(tableQuery, function(error, response){
	if (error) {
		table.error(error.message);
	}
	else {

		// COMPLEX:Strip the timeframe from (cached?) query results because,
		// if it's provided, it breaks the table format
		if (response.result.length === 1 && response.result[0].timeframe) {
			response.result = response.result[0].value;
		}
		table
			.parseRequest(this)
			.render();
	}
});
