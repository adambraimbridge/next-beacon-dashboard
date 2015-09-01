/* global Keen, keen_project, keen_read_key */

"use strict";

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery = function(options) {
	var parameters = {
		eventCollection: "dwell",
		targetProperty: "page.location.pathname",
		filters: [
			// filter removed as deprecated (temporarily?)
			// {operator:"eq",
			// property_name:"user.isStaff",
			// property_value:false},
			{operator:"eq",
			property_name:"page.location.type",
			property_value:"stream"}
		],
		timeframe: options.timeframe,
		timezone: "UTC",
		maxAge: 10800
	};

	return new Keen.Query("count", parameters);
};

var charts = [
	{queryName: "today", elId: "today-metric", options: {
		timeframe: "this_1_days",
		title: "Today"
	}},
	{queryName: "yesterday", elId: "yesterday-metric", options: {
		timeframe: "previous_1_days",
		title: "Yesterday"
	}}
];

charts.forEach(function(chart) {
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId), {
		chartType: "metric",
		title: chart.options.title
	});
});
