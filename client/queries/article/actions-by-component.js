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
			"property_name":"page.location.type",
			"property_value":"article"}].concat(
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
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"article | header | "}
			]
	}},
	{queryName: "moreOnQuery",
		elId: ["more-on-trend-linechart", "more-on-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"more-on | "}
			]
	}},
	{queryName: "relatedSoriesQuery",
		elId: ["related-stories-trend-linechart", "related-stories-trend-areachart"],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":[
					"article | more-on-inline | articles | title", // can remove after Nov 7 2015
					"story-package | articles | title", // can remove after Nov 7 2015
					"article | more-on-inline | articles | article-card | headline",
					"article | more-on-inline | articles | image",
					"story-package | articles | article-card | headline",
					"story-package | articles | image"
					]
				}
			]
	}},
	{queryName: "promoboxQuery",
		elId: ["promo-box-trend-linechart", "promo-box-trend-areachart"],
		options: {
			filters: [
				{"operator":"contains",
				"property_name":"meta.domPath",
				"property_value":"article | promobox | "}
			]
	}},
	{queryName: "linksQuery",
		elId: ["links-trend-linechart"],
		options: {
			filters: [
				{"operator":"eq",
				"property_name":"meta.domPath",
				"property_value":"article | link"}
			]
	}},
	{queryName: "tocQuery",
		elId: ["toc-trend-linechart"],
		options: {
			filters: [
				{"operator":"eq",
				"property_name":"meta.domPath",
				"property_value":"article | table-of-contents | toc"}
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
