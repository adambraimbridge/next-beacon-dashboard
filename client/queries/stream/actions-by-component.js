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
	{queryName: "subHeaderQuery",
		elId: ["sub-header-trend-linechart", "sub-header-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"sub-header |"}
			]
	}},
	{queryName: "hotTopicsQuery",
		elId: ["hot-topics-trend-linechart", "hot-topics-trend-areachart"],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":[
					"stream-hot-topic | topic-link",
					"stream-hot-topic | headline",
					"hot-comment--brand-link-opinion",
					"hot-comment--brand-link-analysis",
					"hot-comment--topic-link-opinion",
					"hot-comment--topic-link-analysis",
					"hot-comment--headline-link-opinion",
					"hot-comment--headline-link-analysis",
					"hot-comment--image-link-opinion",
					"hot-comment--image-link-analysis"
					]
				}
			]
	}},
	{queryName: "articleCardQuery",
		elId: ["article-card-trend-linechart", "article-card-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"stream | article-card |"}
			]
	}},
	{queryName: "relatedItemQuery",
		elId: ["related-item-trend-linechart", "related-item-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"stream | related item |"}
			]
	}},
	{queryName: "myftTrayQuery",
		elId: ["myft-tray-trend-linechart", "myft-tray-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"myft-tray |"}
			]
	}},
	{queryName: "footerQuery",
		elId: ["footer-trend-linechart", "footer-trend-areachart"],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":["pagination | next-page", "pagination | previous-page", "follow"]}
			]
	}},
	{queryName: "photoDiaryQuery",
		elId: ["photo-diary-trend-linechart", "photo-diary-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"stream | photo-diary |"}
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
		title: 'Approximate trend over time (by percentage share)',
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
