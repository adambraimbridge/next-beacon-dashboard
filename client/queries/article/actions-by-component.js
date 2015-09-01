/* global Keen , keen_project, keen_read_key */

'use strict';

var filters = require('./engagement-filters');
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
	{queryName: "articleHeaderQuery",
		elId: ["article-header-trend-linechart", "article-header-trend-areachart"],
		options: {
			filters: filters.articleHeaderFilters
	}},
	{queryName: "moreOnQuery",
		elId: ["more-on-trend-linechart", "more-on-trend-areachart"],
		options: {
			filters: filters.moreOnFilters
	}},
	{queryName: "relatedSoriesQuery",
		elId: ["related-stories-trend-linechart", "related-stories-trend-areachart"],
		options: {
			filters: filters.relatedStoriesFilters
	}},
	{queryName: "promoboxQuery",
		elId: ["promo-box-trend-linechart", "promo-box-trend-areachart"],
		options: {
			filters: filters.promoboxFilters
	}},
	{queryName: "linksQuery",
		elId: ["links-trend-linechart"],
		options: {
			filters: filters.linksFilters
	}},
	{queryName: "tocQuery",
		elId: ["toc-trend-linechart"],
		options: {
			filters: filters.tocFilters
	}}
];

charts.forEach(function(chart) {
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId[0]), {
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

charts.forEach(function(chart) {
	if(chart.elId.length > 1) {
		client.draw(keenQuery(chart.options), document.getElementById(chart.elId[1]), {
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
	}
});
