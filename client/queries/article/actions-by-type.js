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
			"property_value":"article"}
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
					"article | link",
					"article | promobox | link",
					"article | more-on-inline | articles | title", // can remove after Nov 7 2015
					"story-package | articles | title", // can remove after Nov 7 2015
					"article | more-on-inline | articles | article-card | headline",
					"article | more-on-inline | articles | image",
					"story-package | articles | article-card | headline",
					"story-package | articles | image",
					"more-on | article-card | headline",
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
					"article | header | section-link",
					"article | header | author",
					"article | header | tags | tag",
					"more-on | topic-link",
					"myft-tray | topic-link"
				]}
			]
	}},
	{queryName: "shareQuery",
		elId: [
			"share-trend-linechart",
			"share-trend-areachart",
			"share-trend-percent-areachart"
		],
		options: {
			filters: [
				{"operator":"in",
				"property_name":"meta.domPath",
				"property_value":[
					"share | facebook",
					"share | linkedin",
					"share | twitter",
					"share | whatsapp"
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
		title: 'Approximate trend over time - stacked',
		isStacked: true,
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
	client.draw(keenQuery(chart.options), document.getElementById(chart.elId[2]), {
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
