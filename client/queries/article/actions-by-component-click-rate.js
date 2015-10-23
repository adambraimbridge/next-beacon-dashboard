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

var actionsQuery = function(options) {
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

var baseQuery = function() {
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
			"property_value":"article"}
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

var reportsToRun = [
	{filterActions: {filters: filters.promoboxActionFilters},
	filterBase: {filters: filters.promoboxBaseFilters},
	chartEl: "promo-box-trend-clickrate",
	chartTitle: "Promobox Actions as % Articles Loaded That Have A Promobox"},
	{filterActions: {filters: filters.moreOnActionFilters},
	filterBase: {filters: filters.allArticlesBaseFilters},
	chartEl: "more-on-trend-clickrate",
	chartTitle: "More On Actions as % All Articles Loaded"},
	{filterActions: {filters: filters.articleHeaderActionFilters},
	filterBase: {filters: filters.allArticlesBaseFilters},
	chartEl: "article-header-trend-clickrate",
	chartTitle: "Article Header Actions as % All Articles Loaded"},
	{filterActions: {filters: filters.readNextActionFilters},
	filterBase: {filters: filters.allArticlesBaseFilters},
	chartEl: "read-next-trend-clickrate",
	chartTitle: "Read Next Actions as % All Articles Loaded - need to sort out the base for this when A/B sorted"},
	{filterActions: {filters: filters.relatedStoriesActionFilters},
	filterBase: {filters: filters.relatedStoriesBaseFilters},
	chartEl: "related-stories-trend-clickrate",
	chartTitle: "Related Stories Actions as % Articles Loaded That Have A Story Package"},
	{filterActions: {filters: filters.linksActionFilters},
	filterBase: {filters: filters.linksBaseFilters},
	chartEl: "links-trend-clickrate",
	chartTitle: "Article Body Links Actions as % Articles Loaded That Have At Least 1 In Article Link"},
	{filterActions: {filters: filters.tocActionFilters},
	filterBase: {filters: filters.tocBaseFilters},
	chartEl: "toc-trend-clickrate",
	chartTitle: "Table of Contents Actions as % Articles Loaded That Have A Table Of Contents"}
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
	client.run([actionsQuery(options.filterActions), baseQuery(options.filterBase)], function(err, res){
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
				queryAction.value.map(function(el) {
					el.result = (el.result/queryBaseDate[0].value).toFixed(4) * 100;
				});
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
