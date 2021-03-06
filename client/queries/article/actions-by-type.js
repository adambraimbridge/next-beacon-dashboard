/* global Keen , keen_project, keen_read_key */

'use strict';

var filters = require('./engagement-filters');
var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery =	function(options) {
	var parameters = {
		eventCollection: "cta",
		filters: [
			// filters removed for staff and also page type as deprecated in CTA
			// {"operator":"eq",
			// "property_name":"user.isStaff",
			// "property_value":false},
			// {"operator":"eq",
			// "property_name":"page.location.type",
			// "property_value":"article"}
			].concat(
				options.filters
			),
		groupBy: "meta.domPath",
		interval: "daily",
		targetProperty: "time.day",
		timeframe: queryParameters.timeframe || 'previous_14_days',
		timezone: "UTC",
		maxAge:10800
	};

	return new Keen.Query("count", parameters);
};

var charts = [
	{queryName: "articleLinksQuery",
		elId: "article-links-trend-percent-areachart",
		options: {
			filters: filters.articleLinksFilters
	}},
	{queryName: "topiclinksQuery",
		elId: "topic-links-trend-percent-areachart",
		options: {
			filters: filters.topicLinksFilters
	}},
	{queryName: "shareQuery",
		elId: "share-trend-percent-areachart",
		options: {
			filters: filters.shareLinksFilters
	}}
];


charts.forEach(function(chart) {
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId), {
		chartType: "areachart",
		title: 'Approximate trend over time - percentage share',
		chartOptions: {
			height: 450,
			isStacked: 'percent',
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
