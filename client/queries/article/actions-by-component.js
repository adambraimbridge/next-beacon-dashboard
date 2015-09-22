/* global Keen , keen_project, keen_read_key */

'use strict';

var filters = require('./engagement-filters');
var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"
}];
var socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"
}];

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery =	function(options) {
	var optionFilters;
	if (queryParameters.referrerType === 'search') {
		optionFilters = searchReferrer.concat(options.filters);
	} else if (queryParameters.referrerType === 'social') {
		optionFilters = socialReferrer.concat(options.filters);
	} else {
		optionFilters = options.filters;
	}
	var parameters = {
		eventCollection: "cta",
		filters: [
			// filters removed for staff and also page type as deprecated in CTA
			// {"operator":"eq",
			// "property_name":"user.isStaff",
			// "property_value":false},
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"article"},
			{"operator":"exists",
			"property_name":"user.uuid",
			"property_value":true}
		].concat(
				optionFilters
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
		elId: "article-header-trend-areachart",
		options: {
			filters: filters.articleHeaderActionFilters
	}},
	{queryName: "moreOnQuery",
		elId: "more-on-trend-areachart",
		options: {
			filters: filters.moreOnActionFilters
	}},
	{queryName: "relatedSoriesQuery",
		elId: "related-stories-trend-areachart",
		options: {
			filters: filters.relatedStoriesActionFilters
	}},
	{queryName: "readNextQuery",
		elId: "read-next-trend-areachart",
		options: {
			filters: filters.readNextActionFilters
		}
	},
	{queryName: "promoboxQuery",
		elId: "promo-box-trend-areachart",
		options: {
			filters: filters.promoboxActionFilters
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
