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
			// filters removed for staff and also page type as deprecated in CTA
			// {"operator":"eq",
			// "property_name":"user.isStaff",
			// "property_value":false},
			// {"operator":"eq",
			// "property_name":"page.location.type",
			// "property_value":"stream"}
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
		elId: [
			"article-links-trend-linechart",
			"article-links-trend-areachart",
			"article-links-trend-percent-areachart"
		],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":[
					"hot-comment-link-opinion",
					"hot-comment-link-analysis",
					"stream-hot-topic | headline",
					"stream | article-card | headline",
					"stream | article-card | image",
					"stream | photo-diary | headline",
					"myft-tray | myft-feed | article-card | headline"
				]}
			]
	}},
	{queryName: "topiclinksQuery",
		elId: [
			"topic-links-trend-linechart",
			"topic-links-trend-areachart",
			"topic-links-trend-percent-areachart"
		],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":[
					"sub-header | curated-taxonomy | link",
					"sub-header | dynamic-tags | link",
					"stream-hot-topic | topic-link",
					"stream-hot-topic | primary-tag",
					"stream | article-card | primary-tag",
					"stream | article-card | brand",
					"stream | photo-diary | primary-tag",
					"myft-tray | topic-link"
				]}
			]
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
});

charts.forEach(function(chart) {
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId[2]), {
		chartType: "areachart",
		title: 'Approximate trend over time - stacked',
		chartOptions: {
			height: 450,
			isStacked: true,
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
