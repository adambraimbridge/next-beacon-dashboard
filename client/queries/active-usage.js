/* global Keen, $ */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// Degrade gracefully if parameter is missing. Not ideal, but at least it loads something.
if (!queryParameters.feature) {
	queryParameters.feature = 'articleComments';
}

// feature name : cta
var features = {
	'articleComments':'view-comments',
	'articleRelatedContent':'more-on',
	'articleTOC':'toc',
	'dynamicTertiaryNav':'dynamic-tags',
	'linkedDataOrganisationSummary': 'organisation-summary',
	'follow':'follow',
	'globalNavigation':'primary-nav',
	'homePageLoadMore':'toggle-more-stories',
	'homePageMyFTPanel':'myft-panel',
	'homePageMyPageFeed':'myft-panel | myft-topic | follow',
	'marketDataAPI':'markets-link',
	'myPageTopicSuggestions':'my-page-onboarding',
	'pagination':'next-page',
	'saveForLater':'save-for-later',
	'search':'search-form',
	'myFTReadingListOnArticle': 'myft-reading-list'
};

$('.feature-name').fadeOut(function(){ $(this).text(queryParameters.feature).fadeIn(); });
$('.feature-cta').fadeOut(function(){ $(this).text(features[queryParameters.feature]).fadeIn(); });

var beaconHref = 'https://beacon.ft.com/graph?event_collection=cta&metric=count&group_by=meta.domPath&timeframe=this_14_days&title=Trackable%20element:%20'+ features[queryParameters.feature] +'&domPathContains='+ features[queryParameters.feature];
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
	return [
		// Users who visited next.ft in a one-week period, two weeks whence
		step({
			timeframe: {
				start:daysFromNow(-14), //two weeks whence
				end:daysFromNow(-7) //one week whence
			},
			filters: options.filters
		}),
		// Users who visited next.ft in the last 7 days
		step({
			timeframe: {
				start:daysFromNow(-7), //one week whence
				end:daysFromNow() //now
			}
		}),
		// Users who clicked the given CTA in the past two weeks
		step({
			eventCollection: "cta",
			timeframe: {
				start:daysFromNow(-14), //two weeks whence
				end:daysFromNow() //now
			},
			filters: [{
				property_name:"meta.domPath",
				operator:"contains",
				property_value:options.cta
			}]
		})
	];
};

var prepareQuery = (function () {
	var queryAll = new Keen.Query("funnel", {
		steps:activeUserStepsForFeature({
			cta: features[queryParameters.feature]
		}),
		maxAge: 10800
	});

	var queryLargeDevices = new Keen.Query("funnel", {
		steps:activeUserStepsForFeature({
			cta: features[queryParameters.feature],
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
			cta: features[queryParameters.feature],
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
			cta: features[queryParameters.feature],
			filters: [{
				property_name:"user.layout",
				operator:"in",
				property_value:["XS","S","default"]
			}]
		}),
		maxAge: 10800
	});

	return [
		queryAll,
		queryLargeDevices,
		queryMediumDevices,
		querySmallDevices
	];
}());

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

var renderDashboard = function (el, results, opts) {
	var resultsAll = results[0];
	var resultsLarge = results[1];
	var resultsMedium = results[2];
	var resultsSmall = results[3];

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
};

module.exports = {
	query:prepareQuery,
	render:renderDashboard
};
