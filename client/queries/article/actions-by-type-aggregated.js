/* global Keen , keen_project, keen_read_key */

"use strict";

var filters = require('./engagement-filters');
var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));
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

var actionsQuery =	function(options) {
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
			// filters removed for staff as deprecated in CTA
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
		interval: "daily",
		timeframe: queryParameters.timeframe || 'previous_14_days',
		timezone: "UTC",
		maxAge:10800
	};

	return new Keen.Query("count", parameters);
};

var baseQuery =	function() {
	var optionFilters = [];
	if (queryParameters.referrerType === 'search') {
		optionFilters = searchReferrer;
	}
	if (queryParameters.referrerType === 'social') {
		optionFilters = socialReferrer;
	}
	var parameters = {
		eventCollection: "dwell",
		filters: [
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"article"},
			{"operator":"exists",
			"property_name":"user.uuid",
			"property_value":true}
		].concat(optionFilters),
		interval: "daily",
		timeframe: queryParameters.timeframe || 'previous_14_days',
		timezone: "UTC",
		maxAge:10800
	};

	return new Keen.Query("count", parameters);
};

var reportsToRun = [
	{queryName: "articleLinksQuery",
		chartEl: "article-links-trend-aggregate",
		chartTitle: "Total Links to Articles as % All Articles Loaded",
		options: {
			filters: filters.articleLinksFilters
	}},
	{queryName: "topiclinksQuery",
		chartEl: "topic-links-trend-aggregate",
		chartTitle: "Total Links to Stream Pages as % All Articles Loaded",
		options: {
			filters: filters.topicLinksFilters
	}},
	{queryName: "shareQuery",
		chartEl: "share-trend-aggregate",
		chartTitle: "Total Article Shares as % All Articles Loaded",
		options: {
			filters: filters.shareLinksFilters
	}}
];

var chart = function(options) {
	return new Keen.Dataviz()
		.el(document.getElementById(options.chartEl))
		.title(options.chartTitle)
		.chartType("linechart")
		.chartOptions({
			height: 450,
			curveType:'function',
			hAxis: {
				format: 'E d'
			},
			chartArea: {
				left: '10%',
				width: '75%'
			}
		})
		.prepare();
};

var runQuery = function(options) {
	client.run([actionsQuery(options.options), baseQuery()], function(err, res){
		if (err) {
			console.log(err.message);
		}
		else {
			// divide actions by articles to get click rate
			var queryActions = res[0].result;
			var queryBase = res[1].result;

			queryActions.map(function(queryAction) {
				var queryBaseDate = queryBase.filter(function(el) {
					return JSON.stringify(el.timeframe) === JSON.stringify(queryAction.timeframe);
				});
				queryAction.value = (queryAction.value/queryBaseDate[0].value).toFixed(4) * 100;
			});

			chart({chartEl: options.chartEl, chartTitle: options.chartTitle})
				.parseRawData({
					result: queryActions
				})
				.render();
		}
	});
};

reportsToRun.forEach(function(report) {
	runQuery(report);
});
