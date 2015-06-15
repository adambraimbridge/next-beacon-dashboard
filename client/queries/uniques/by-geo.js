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
		targetProperty: "user.uuid",
		timezone: "UTC",
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}],
		maxAge: 3600
	};

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || "daily";
	}
	return new Keen.Query("count_unique", parameters);
};

var continentQuery = keenQuery({
	groupBy:'user.geo.continent'
});

var countryQuery = keenQuery({
	groupBy:'user.geo.country_name',
	interval: false
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
		.sortGroups("desc")
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
		.sortGroups("desc")
		.height(450)
		.prepare();

	var columnchart_stacked = new Keen.Dataviz()
		.el(document.getElementById("columnchart_stacked"))
		.chartType("columnchart")
		.chartOptions({
			isStacked:'percent',
			hAxis: {
				format: 'E d'
			},
			chartArea: {
				left: '10%',
				width: '75%'
			}
		})
		.title('Daily totals as percentages')
		.sortGroups("desc")
		.height(500)
		.prepare();

	client.run(continentQuery, function(error, response){
		if (error) {
			linechart.error(error.message);
		}
		else {
			linechart
				.parseRequest(this)
				.render();

			columnchart
				.parseRequest(this)
				.render();

			columnchart_stacked
				.parseRequest(this)
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

	client.run(countryQuery, function(error, response){
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
	query:continentQuery,
	render:render
};
