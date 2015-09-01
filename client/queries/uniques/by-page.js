/* global Keen */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// This is a base query object, for spawning queries.
var keenQuery = function(options) {
	var parameters = {
		groupBy: options.groupBy,
		eventCollection: "dwell",
		timeframe: queryParameters.timeframe || "this_14_days",
		target_property: queryParameters.target_property || "user.uuid",
		timezone: "UTC",
		filters:options.filters || [],
		maxAge: 10800
	};

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}
	return new Keen.Query("count_unique", parameters);
};

var query = keenQuery({
	groupBy:'page.location.type'
});

var render = function (el, results, opts, client) {

	var linechart = new Keen.Dataviz()
		.el(document.getElementById("linechart"))
		.chartType("linechart")
		.chartOptions({
			curveType:'function',
			hAxis: {
				format: 'E d'
			},
			chartArea: {
				left: '10%',
				width: '75%'
			}
		})
		.title('Approximate flow over time')
		.height(450)
		.prepare();

	var columnchart = new Keen.Dataviz()
		.el(document.getElementById("columnchart"))
		.chartType("columnchart")
		.chartOptions({
			hAxis: {
				format: 'E d'
			},
			chartArea: {
				left: '10%',
				width: '75%'
			}
		})
		.title('Daily totals in real numbers')
		.height(450)
		.prepare();

	var barchart_stacked = new Keen.Dataviz()
		.el(document.getElementById("barchart_stacked"))
		.chartType("barchart")
		.chartOptions({
			isStacked:'percent',
			vAxis: {
				format: 'E d'
			},
			hAxis: {
				textPosition: 'none'
			},
			chartArea: {
				left: '10%',
				width: '75%'
			}
		})
		.title('Daily totals as percentages')
		.height(500)
		.prepare();

	client.run(query, function(error, response){
		if (error) {
			linechart.error(error.message);
		}
		else {
			linechart
				.parseRequest(this)
				.sortGroups("desc")
				.render();

			columnchart
				.parseRequest(this)
				.sortGroups("desc")
				.render();

			barchart_stacked
				.parseRequest(this)
				.sortGroups("desc")
				.render();
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

	var unknownPageTypeQuery = keenQuery({
		groupBy:'page.location.href',
		interval: false,
		filters: [{
			property_name:"page.location.type",
			operator:"eq",
			property_value:"unknown"
		}]
	});

	client.run(unknownPageTypeQuery, function(error, response){
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
};

module.exports = {
	query:query,
	render:render
};
