/* global Keen */

'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var metric_primary = new Keen.Dataviz()
	.el(document.getElementById("metric_primary"))
	.chartType("metric")
	.height(140)
	.prepare();

var metric_secondary_hover = new Keen.Dataviz()
	.el(document.getElementById("metric_secondary_hover"))
	.chartType("metric")
	.height(140)
	.prepare();

var metric_secondary_header = new Keen.Dataviz()
	.el(document.getElementById("metric_secondary_header"))
	.chartType("metric")
	.height(140)
	.prepare();

var metric_tertiary_stream = new Keen.Dataviz()
	.el(document.getElementById("metric_tertiary_stream"))
	.chartType("metric")
	.height(140)
	.prepare();

var metric_tertiary_article = new Keen.Dataviz()
	.el(document.getElementById("metric_tertiary_article"))
	.chartType("metric")
	.height(140)
	.prepare();

var table = new Keen.Dataviz()
	.el(document.getElementById("table"))
	.chartType("table")
	.chartOptions({
		width:"100%",
		height:"500",
		sortAscending:false,
		sortColumn:1
	})
	.prepare();

// This is a base query object, for spawning queries.
var keenQuery = function(options) {
	var parameters = {
		eventCollection: options.eventCollection || "dwell",
		timeframe: queryParameters.timeframe || "this_14_days",
		targetProperty: options.targetProperty || "user.uuid",
		timezone: "UTC",
		filters:options.filters || [],
		maxAge: 10800
	};

	if (options.groupBy) {
		parameters['groupBy'] = options.groupBy;
	}

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}

	return new Keen.Query("count_unique", parameters);
};

// Total count of unique visitors by dwell
var metricTotalQuery = new keenQuery({
	interval: false
});

// Total count of unique visitors by CTA: "primary-nav" (excluding "secondary-navigation")
var metricPrimaryQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"primary-nav"
	},
	{
		"property_name":"meta.domPath",
		"operator":"not_contains",
		"property_value":"secondary-navigation"
	}]
});

// Total count of unique visitors by CTA: "secondary-navigation"
var metricSecondaryHoverQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"secondary-navigation"
	}]
});

// Total count of unique visitors by CTA: "curated-taxonomy"
var metricSecondaryHeaderQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"curated-taxonomy"
	}]
});

// Total count of unique visitors by CTA: "dynamic-tags"
var metricTertiaryStreamQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"dynamic-tags"
	}]
});

// Total count of unique visitors by CTA: "article | header | tags"
var metricTertiaryArticleQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"article | header | tags"
	}]
});

var tableQuery = new keenQuery({
	eventCollection: "cta",
	interval: false,
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"header"
	}],
	groupBy: "meta.domPath"
});

var render = function (el, results, opts, client) {
	var resultTotal = results[0].result;
	var resultPrimary = results[1].result;
	var resultSecondaryHover = results[2].result;
	var resultSecondaryHeader = results[3].result;
	var resultTertiaryStream = results[4].result;
	var resultTertiaryArticle = results[5].result;
	var resultTable = results[6];

	var percentagePrimary = parseFloat((100 / resultTotal * resultPrimary).toFixed(2));
	var percentageSecondaryHover = parseFloat((100 / resultTotal * resultSecondaryHover).toFixed(2));
	var percentageSecondaryHeader = parseFloat((100 / resultTotal * resultSecondaryHeader).toFixed(2));
	var percentageTertiaryStream = parseFloat((100 / resultTotal * resultTertiaryStream).toFixed(2));
	var percentageTertiaryArticle = parseFloat((100 / resultTotal * resultTertiaryArticle).toFixed(2));

	metric_primary
		.title(percentagePrimary+"% <small>clicked at least one <b>primary</b> menu item (" + resultPrimary + " out of " + resultTotal + ")</small>")
		.parseRawData({ result:percentagePrimary })
		.render();

	metric_secondary_hover
		.title(percentageSecondaryHover+"% <small>clicked at least one <b>secondary-hover</b> menu item (" + resultSecondaryHover + " out of " + resultTotal + ")</small>")
		.parseRawData({ result:percentageSecondaryHover })
		.render();

	metric_secondary_header
		.title(percentageSecondaryHeader+"% <small>clicked at least one <b>secondary-header</b> menu item (" + resultSecondaryHeader + " out of " + resultTotal + ")</small>")
		.parseRawData({ result:percentageSecondaryHeader })
		.render();

	metric_tertiary_stream
		.title(percentageTertiaryStream+"% <small>clicked at least one <b>tertiary-stream</b> menu item (" + resultTertiaryStream + " out of " + resultTotal + ")</small>")
		.parseRawData({ result:percentageTertiaryStream })
		.render();

	metric_tertiary_article
		.title(percentageTertiaryArticle+"% <small>clicked at least one <b>tertiary-article</b> menu item (" + resultTertiaryArticle + " out of " + resultTotal + ")</small>")
		.parseRawData({ result:percentageTertiaryArticle })
		.render();

	table
		.parseRawData(resultTable)
		.render();
};

module.exports = {
	query:[
		metricTotalQuery,
		metricPrimaryQuery,
		metricSecondaryHoverQuery,
		metricSecondaryHeaderQuery,
		metricTertiaryStreamQuery,
		metricTertiaryArticleQuery,
		tableQuery
	],
	render:render
};
