/* global Keen */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var metric_large = new Keen.Dataviz()
	.title("% Large (XXL, XL, and L)")
	.el(document.getElementById("metric_large"))
	.chartType("metric")
	.prepare();

var metric_medium = new Keen.Dataviz()
	.title("% Medium (M)")
	.el(document.getElementById("metric_medium"))
	.chartType("metric")
	.prepare();

var metric_small = new Keen.Dataviz()
	.title("% Small (S, XS and default)")
	.el(document.getElementById("metric_small"))
	.chartType("metric")
	.prepare();

var linechart = new Keen.Dataviz()
	.el(document.getElementById("linechart"))
	.chartType("linechart")
	.chartOptions({
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Approximate flow over time')
	.height(450)
	.prepare();

var columnchart = new Keen.Dataviz()
	.el(document.getElementById("columnchart"))
	.chartType("columnchart")
	.chartOptions({
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Daily totals in real numbers')
	.height(450)
	.prepare();

var barchart_stacked = new Keen.Dataviz()
	.el(document.getElementById("barchart_stacked"))
	.chartType("barchart")
	.chartOptions({
		isStacked:'percent',
		vAxis: {
			format: 'E d'
		},
		hAxis: {
			textPosition: 'none'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Daily totals as percentages')
	.height(500)
	.prepare();

// This is a base query object, for spawning queries.
var keenQuery = function(options) {
	var parameters = {
		eventCollection: "dwell",
		timeframe: queryParameters.timeframe || "this_14_days",
		targetProperty: "user.uuid",
		timezone: "UTC",
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}].concat(options.filters || []),
		maxAge: 3600
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

var metricTotalQuery = new keenQuery({
	interval: false
});

var metricLargeQuery = new keenQuery({
	interval: false,
	filters: [{
		"property_name":"user.layout",
		"operator":"in",
		"property_value":["XXL","XL","L"]
	}],
	maxAge: 3600
});

var metricMediumQuery = new keenQuery({
	interval: false,
	filters: [{
		"property_name":"user.layout",
		"operator":"in",
		"property_value":["M"]
	}],
	maxAge: 3600
});

var metricSmallQuery = new keenQuery({
	interval: false,
	filters: [{
		"property_name":"user.layout",
		"operator":"in",
		"property_value":["S","XS", "default"]
	}],
	maxAge: 3600
});

var intervalQuery = keenQuery({
	groupBy:'user.layout'
});

var render = function (el, results, opts, client) {
	var resultTotal = results[0].result;
	var resultLarge = results[1].result;
	var resultMedium = results[2].result;
	var resultSmall = results[3].result;

	var percentageLarge = (100 / resultTotal * resultLarge).toFixed(2);
	var percentageMedium = (100 / resultTotal * resultMedium).toFixed(2);
	var percentageSmall = (100 / resultTotal * resultSmall).toFixed(2);

	metric_large
		.parseRawData({ result:parseFloat(percentageLarge) })
		.render();

	metric_medium
		.parseRawData({ result:parseFloat(percentageMedium) })
		.render();

	metric_small
		.parseRawData({ result:parseFloat(percentageSmall) })
		.render();

	linechart
		.parseRawData(results[4])
		.sortGroups("desc")
		.render();

	columnchart
		.parseRawData(results[4])
		.sortGroups("desc")
		.render();

	barchart_stacked
		.parseRawData(results[4])
		.sortGroups("desc")
		.render();
};

module.exports = {
	query:[metricTotalQuery, metricLargeQuery, metricMediumQuery, metricSmallQuery, intervalQuery],
	render:render
};
