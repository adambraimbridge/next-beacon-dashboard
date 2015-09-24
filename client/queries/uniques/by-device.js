/* global Keen, _, $ */

'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search);

var metric_large = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Large (XL and L)")
	.el(document.getElementById("metric_large"))
	.chartType("metric")
	.prepare();

var metric_medium = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Medium (M)")
	.el(document.getElementById("metric_medium"))
	.chartType("metric")
	.prepare();

var metric_small = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Small (S, XS and default)")
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
		groupBy: "user.layout",
		timezone: "UTC",
		filters:options.filters || [],
		maxAge: 10800
	};

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}

	return new Keen.Query("count_unique", parameters);
};

var metricQuery = new keenQuery({
	interval: false
});

var intervalQuery = keenQuery({});

var render = function (el, results, opts, client) {
	var resultMetric = results[0];
	var resultInterval = results[1];

	var total = _.sum(resultMetric.result, 'result');
	var totalLarge = _.sum(resultMetric.result, function(object) {
		if (_.includes(["XL","L"], object['user.layout'])) return object.result;
	});
	var totalMedium = _.sum(resultMetric.result, function(object) {
		if (_.includes(["M"], object['user.layout'])) return object.result;
	});
	var totalSmall = _.sum(resultMetric.result, function(object) {
		if (_.includes(["XS","S","default"], object['user.layout'])) return object.result;
	});
	var totalRemainder = total - _.sum([totalLarge,totalMedium,totalSmall]);

	var percentageLarge = parseFloat((100 / total * totalLarge).toFixed(2));
	var percentageMedium = parseFloat((100 / total * totalMedium).toFixed(2));
	var percentageSmall = parseFloat((100 / total * totalSmall).toFixed(2));
	var percentageRemainder = parseFloat((100 / total * totalRemainder).toFixed(2));

	metric_large
		.parseRawData({ result:percentageLarge })
		.render();

	metric_medium
		.parseRawData({ result:percentageMedium })
		.render();

	metric_small
		.parseRawData({ result:percentageSmall })
		.render();

	$('#percentage_remainder').html('With a ' + percentageRemainder + '% remainder ("none" and "null" values)');

	linechart
		.parseRawData(resultInterval)
		.sortGroups("desc")
		.render();

	columnchart
		.parseRawData(resultInterval)
		.sortGroups("desc")
		.render();

	barchart_stacked
		.parseRawData(resultInterval)
		.sortGroups("desc")
		.render();
};

module.exports = {
	query:[metricQuery, intervalQuery],
	render:render
};
