/* global Keen */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	timeframe: queryParameters.timeframe || "this_14_days",
	interval: queryParameters.interval || "daily",
	groupBy: "page.location.type",
	targetProperty: "user.uuid",
	timezone: "UTC",
	filters:[{
		property_name:"user.isStaff",
		operator:"eq",
		property_value:false
	}],
	maxAge: 3600
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
};

module.exports = {
	query:query,
	render:render
};
