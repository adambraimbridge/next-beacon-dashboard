/* global Keen, $, _ */

'use strict';

var client = require('../lib/wrapped-keen');

var humanize = require('humanize');

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// Degrade gracefully if parameter is missing. Not ideal, but at least it loads something.
// See server/middleware/active-usage.js for details
var feature;
if (!queryParameters.feature) {
	feature = window.activeUsageFeatures[0];
} else {
	feature = _.find(window.activeUsageFeatures, function(feature) {
		return feature.flagName === queryParameters.feature;
	});
}

// Replace some text placeholders with appropriate content
$('.feature-name').fadeOut(function(){ $(this).text(feature.flagName).fadeIn(); });
$('.feature-cta').fadeOut(function(){ $(this).text(feature.cta).fadeIn(); });

if (feature.state === "404") {
	$('.feature-expiry-date').fadeOut(function(){ $(this).html('Note: This feature was not found in the <a target="_blank" href="https://github.com/Financial-Times/next-feature-flags-api/blob/master/models/flags.js">feature-flags API</a>.').fadeIn(); });
}
else {
	$('.feature-expiry-date').fadeOut(function(){ $(this).text("Feature expiry date: " + humanize.date('D jS M Y', new Date(feature.expiry))).fadeIn(); });

	if (feature.state === false) {
		$('.feature-is-off').text("This feature is currently switched off in next.ft.com.");
	}

	if (feature.image_src) {
		$('.feature-image').append($('<img/>', {
			"class":"feature-image",
			"src":feature.image_src
		}));
	}
}

// Apply an appropriate href to placeholder links
var beaconHref = 'https://beacon.ft.com/graph?event_collection=cta&metric=count&group_by=meta.domPath&timeframe=this_14_days&title=Trackable%20element:%20'+ feature.cta +'&domPathContains='+ feature.cta;
$('.beacon-href').attr('href',beaconHref);

// Return the ISO string for relative dates
var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

// This is a base step object, for spawning steps.
var step = function(options) {
	return {
		eventCollection:options.eventCollection || "dwell",
		actor_property:"user.uuid",
		timeframe:options.timeframe,
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}].concat(options.filters || [])
	};
};

var activeUserStepsForFeature = function (options) {

	// Accept an offset to enable a history for the same active-usage funnel
	// (e.g. this week, last week, two weeks ago, three weeks ago)
	var historicOffset = options.historicOffset || 0;
	return [
		// Users who visited next.ft in a one-week period, two weeks whence
		step({
			timeframe: {
				start:daysFromNow(historicOffset -14), //two weeks whence
				end:daysFromNow(historicOffset -7) //one week whence
			},
			filters: options.filters
		}),
		// Users who visited next.ft in the last 7 days
		step({
			timeframe: {
				start:daysFromNow(historicOffset -7), //one week whence
				end:daysFromNow(historicOffset) //now
			}
		}),
		// Users who clicked the given CTA in the past two weeks
		step({
			eventCollection: "cta",
			timeframe: {
				start:daysFromNow(historicOffset -14), //two weeks whence
				end:daysFromNow(historicOffset) //now
			},
			filters: [{
				property_name:"meta.domPath",
				operator:"contains",
				property_value:options.cta
			}]
		})
	];
};

// --
// Keen queries
// --
var queryAll = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta
	}),
	maxAge: 10800
});

var queryLargeDevices = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		filters: [{
			property_name:"user.layout",
			operator:"in",
			property_value:["XL","L"]
		}]
	}),
	maxAge: 10800
});

var queryMediumDevices = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		filters: [{
			property_name:"user.layout",
			operator:"in",
			property_value:["M"]
		}]
	}),
	maxAge: 10800
});

var querySmallDevices = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		filters: [{
			property_name:"user.layout",
			operator:"in",
			property_value:["XS","S","default"]
		}]
	}),
	maxAge: 10800
});

// --
// Graph containers
// --
var metric_all = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Active usage (all devices)")
	.el(document.getElementById("metric_all"))
	.chartType("metric")
	.prepare();

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

// --
// Rendering
// --
client.run([
	queryAll,
	queryLargeDevices,
	queryMediumDevices,
	querySmallDevices
], function(error, response){
	if (error) {
		throw new Error("Keen query error: " + error.message);
	}
	else {
		var resultsAll = response[0];
		var resultsLarge = response[1];
		var resultsMedium = response[2];
		var resultsSmall = response[3];

		var percentageAll = parseFloat((100 / resultsAll.result[1] * resultsAll.result[2]).toFixed(2));
		var percentageLarge = parseFloat((100 / resultsLarge.result[1] * resultsLarge.result[2]).toFixed(2));
		var percentageMedium = parseFloat((100 / resultsMedium.result[1] * resultsMedium.result[2]).toFixed(2));
		var percentageSmall = parseFloat((100 / resultsSmall.result[1] * resultsSmall.result[2]).toFixed(2));

		$('#resultsAll0').text(resultsAll.result[0]);
		$('#resultsAll1').text(resultsAll.result[1]);
		$('#resultsAll2').text(resultsAll.result[2]);
		$('#percentageAll').text(percentageAll);

		metric_all
			.parseRawData({ result:percentageAll })
			.render();

		metric_large
			.parseRawData({ result:percentageLarge })
			.render();

		metric_medium
			.parseRawData({ result:percentageMedium })
			.render();

		metric_small
			.parseRawData({ result:percentageSmall })
			.render();
	}
});


// --
// Show the same active-usage funnel, only older.
// --
var metric_all_three_weeks_ago = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.el(document.getElementById("metric_all_three_weeks_ago"))
	.chartType("metric")
	.prepare();

var metric_all_two_weeks_ago = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.el(document.getElementById("metric_all_two_weeks_ago"))
	.chartType("metric")
	.prepare();

var metric_all_one_week_ago = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.el(document.getElementById("metric_all_one_week_ago"))
	.chartType("metric")
	.prepare();

var queryThreeWeeksAgo = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		historicOffset: -21
	}),
	maxAge: 10800
});
var queryTwoWeeksAgo = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		historicOffset: -14
	}),
	maxAge: 10800
});
var queryOneWeekAgo = new Keen.Query("funnel", {
	steps:activeUserStepsForFeature({
		cta: feature.cta,
		historicOffset: -7
	}),
	maxAge: 10800
});

client.run([
	queryThreeWeeksAgo,
	queryTwoWeeksAgo,
	queryOneWeekAgo
], function(error, response){
	if (error) {
		throw new Error("Keen query error: " + error.message);
	}
	else {
		var resultsAllThreeWeeksAgo = response[2];
		var resultsAllTwoWeeksAgo = response[1];
		var resultsAllOneWeekAgo = response[0];

		var percentageAllThreeWeeksAgo = parseFloat((100 / resultsAllThreeWeeksAgo.result[1] * resultsAllThreeWeeksAgo.result[2]).toFixed(2));
		var percentageAllTwoWeeksAgo = parseFloat((100 / resultsAllTwoWeeksAgo.result[1] * resultsAllTwoWeeksAgo.result[2]).toFixed(2));
		var percentageAllOneWeekAgo = parseFloat((100 / resultsAllOneWeekAgo.result[1] * resultsAllOneWeekAgo.result[2]).toFixed(2));

		metric_all_three_weeks_ago
			.parseRawData({ result:percentageAllThreeWeeksAgo })
			.title("Three weeks ago <br/><small>(" + humanize.date('D jS', new Date(resultsAllThreeWeeksAgo.steps[1].timeframe.start)) + " to " + humanize.date('D jS M', new Date(resultsAllThreeWeeksAgo.steps[1].timeframe.end)) + ")</<small>")
			.render();

		metric_all_two_weeks_ago
			.parseRawData({ result:percentageAllTwoWeeksAgo })
			.title("Two weeks ago <br/><small>(" + humanize.date('D jS', new Date(resultsAllTwoWeeksAgo.steps[1].timeframe.start)) + " to " + humanize.date('D jS M', new Date(resultsAllTwoWeeksAgo.steps[1].timeframe.end)) + ")</<small>")
			.render();

		metric_all_one_week_ago
			.parseRawData({ result:percentageAllOneWeekAgo })
			.title("One week ago <br/><small>(" + humanize.date('D jS', new Date(resultsAllOneWeekAgo.steps[1].timeframe.start)) + " to " + humanize.date('D jS M', new Date(resultsAllOneWeekAgo.steps[1].timeframe.end)) + ")</<small>")
			.render();

	}
});
