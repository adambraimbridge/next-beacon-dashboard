/* global Keen, keen_project, keen_read_key, _ */

"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

// This is a base query object, for spawning queries.
var keenQuery = function(options) {
	options = options || {};
	var parameters = {
		eventCollection: "dwell",
		timeframe: queryParameters.timeframe || "this_14_days",
		targetProperty: "user.uuid",
		groupBy: options.groupBy,
		timezone: "UTC",
		filters:[{
			property_name:"page.location.pathname",
			operator:"contains",
			property_value:"errors/page"
		}],
		maxAge: 10800
	};

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}

	return new Keen.Query("count", parameters);
};

var linechartQuery = keenQuery({
	groupBy: "page.location.pathname"
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

var tableQuery = keenQuery({
	interval: false,
	groupBy: ["page.referrer.pathname","page.location.pathname"]
});
client.run(tableQuery, function(error, response){
	if (error) {
		table.error(error.message);
	}
	else {

		// Keen visualisation does not yet support multi-column tables.
		// So add the error number to the page URL column.
		// See: https://groups.google.com/forum/#!topic/keen-io-devs/Iu55VBrvBeU
		response.result = _.map(response.result, function(row){
			if (!row["page.location.pathname"] || !row["page.referrer.pathname"]) return;

			// "page.location.pathname" is expected to be e.g. "errors/page/400"
			var errorNumber = row["page.location.pathname"].substring(row["page.location.pathname"].length - 3);
			row["page.referrer.pathname"] = "(" + errorNumber +") " + row["page.referrer.pathname"];

			// Remove the unwanted column
			delete(row['page.location.pathname']);
			return row;
		});

		table
			.parseRawData(response)
			.render();
	}
});
