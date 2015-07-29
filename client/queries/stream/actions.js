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
	{queryName: "hotTopicsQuery", elId: "hot-topics-trend-linechart", options: {
		filters: [
			{"operator":"contains",
			"property_name":"meta.domPath",
			"property_value":"stream-hot-topic |"}
		]
	}},
	{queryName: "articleCardQuery", elId: "article-card-trend-linechart", options: {
		filters: [
			{"operator":"contains",
			"property_name":"meta.domPath",
			"property_value":"stream | article-card |"}
		]
	}},
	{queryName: "relatedItemQuery", elId: "related-item-trend-linechart", options: {
		filters: [
			{"operator":"contains",
			"property_name":"meta.domPath",
			"property_value":"stream | related item |"}
		]
	}},
	{queryName: "photoDiaryQuery", elId: "photo-diary-trend-linechart", options: {
		filters: [
			{"operator":"contains",
			"property_name":"meta.domPath",
			"property_value":"stream | photo-diary |"}
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
