/* global Keen , keen_project, keen_read_key */

"use strict";

var filters = require('./engagement-filters');
var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery = function(options) {
	var parameters = {
		eventCollection: "cta",
		filters: [
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

var articlesLoadedQuery = new Keen.Query("count", {
	eventCollection: "dwell",
	filters: [
		{"operator":"eq",
		"property_name":"page.location.type",
		"property_value":"article"}
	],
	interval: "daily",
	targetProperty: "time.day",
	timeframe: queryParameters.timeframe || 'previous_14_days',
	timezone: "UTC",
	maxAge:10800
});

var promoboxActions = keenQuery({
	filters: filters.promoboxFilters
});

var moreOnActions = keenQuery({
	filters: filters.moreOnFilters
});

var articleHeaderActions = keenQuery({
	filters: filters.articleHeaderFilters
});

var relatedStoriesActions = keenQuery({
	filters: filters.relatedStoriesFilters
});

var linksActions = keenQuery({
	filters: filters.linksFilters
});

var tocActions = keenQuery({
	filters: filters.tocFilters
});

var reportsToRun = [
	{query: promoboxActions,
	chartEl: "promo-box-trend-clickrate",
	chartTitle: "Promobox Actions as % Articles Loaded (NOTE: not all articles have a promobox)"},
	{query: moreOnActions,
	chartEl: "more-on-trend-clickrate",
	chartTitle: "More On Actions as % Articles Loaded"},
	{query: articleHeaderActions,
	chartEl: "article-header-trend-clickrate",
	chartTitle: "Article Header Actions as % Articles Loaded"},
	{query: relatedStoriesActions,
	chartEl: "related-stories-trend-clickrate",
	chartTitle: "Related Stories Actions as % Articles Loaded (NOTE: not all articles have related stories)"},
	{query: linksActions,
	chartEl: "links-trend-clickrate",
	chartTitle: "Article Body Links Actions as % Articles Loaded"},
	{query: tocActions,
	chartEl: "toc-trend-clickrate",
	chartTitle: "Table of Contents Actions as % Articles Loaded (NOTE: not all articles have table of contents)"}
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
	client.run([options.query, articlesLoadedQuery], function(err, res){
		if (err) {
			chart.error(err.message);
		}
		else {
			// divide actions by articles to get click rate
			var queryActions = res[0].result;
			var articlesLoaded = res[1].result;

			queryActions.map(function(queryAction) {
				var articlesLoadedDate = articlesLoaded.filter(function(el) {
					return JSON.stringify(el.timeframe) === JSON.stringify(queryAction.timeframe);
				});
				queryAction.value.map(function(el) {
					el.result = (el.result/articlesLoadedDate[0].value).toFixed(4) * 100;
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
