/* global Keen , keen_project, keen_read_key */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery =	function(options) {
	var parameters = {
		eventCollection: "cta",
		filters: [
			{"operator":"eq",
			"property_name":"user.isStaff",
			"property_value":false}].concat(
				options.filters
			),
		groupBy: "meta.domPath",
		interval: "daily",
		targetProperty: "time.day",
		timeframe: queryParameters.timeframe || 'this_14_days',
		timezone: "UTC",
		maxAge:10800
	};

	return new Keen.Query("count", parameters);
};

var charts = [
	{queryName: "promoboxQuery", elId: "promo-box-trend-linechart", options: {
		filters: [
			{"operator":"contains",
			"property_name":"meta.domPath",
			"property_value":"article | promobox"}
		]
	}},
	{queryName: "linksQuery", elId: "links-trend-linechart", options: {
		filters: [
			{"operator":"eq",
			"property_name":"meta.domPath",
			"property_value":"article | link"}
		]
	}},
	{queryName: "tocQuery", elId: "toc-trend-linechart", options: {
		filters: [
			{"operator":"eq",
			"property_name":"meta.domPath",
			"property_value":"article | table-of-contents | toc"}
		]
	}}
];

charts.forEach(function(chart) {
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId), {
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
});
