/* global Keen, $ */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// feature name : cta
var features = {
	'articleComments':'view-comments',
	'articleRelatedContent':'more-on',
	'articleTOC':'toc',
	'dynamicTertiaryNav':'dynamic-tags',
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

var activeUserStepsForFeature = function (cta) {
	return [
		// Users who visited next.ft in a one-week period, two weeks whence
		step({
			timeframe: {
				start:daysFromNow(-14), //two weeks whence
				end:daysFromNow(-7) //one week whence
			},
			maxAge: 3600
		}),
		// Users who visited next.ft in the last 7 days
		step({
			timeframe: {
				start:daysFromNow(-7), //one week whence
				end:daysFromNow() //now
			},
			maxAge: 3600
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
				property_value:cta
			}],
			maxAge: 3600
		})
	];
};

var renderDashboard = function (el, results, opts) {

	var percentage = (100 / results.result[1] * results.result[2]).toFixed(2);

	$('<h1>').text('Feature: ' + queryParameters.feature).appendTo(el);

	$('<div>').attr('id', 'metric')
		.appendTo(el);

	// See: https://github.com/keen/keen-js/blob/master/docs/visualization.md#pass-in-your-own-data-to-charts
	new Keen.Dataviz()
		.el(document.getElementById('metric'))
		.parseRawData({ result:parseFloat(percentage) })
		.chartType("metric")
		.title("% Active usage")
		.render();

	$('<h3>').text('How this is calculated:').appendTo(el);

	var table = $('<table>').addClass('explanation');

	$('<tr>')
		.append($('<td>').text('How many users visited next.ft in a one-week period, two weeks ago?'))
		.append($('<td>').html('<b>' + results.result[0] + ' users</b>'))
		.appendTo(table);

	$('<tr>')
		.append($('<td>').text('Of those users, how many visited next.ft in the last seven days?'))
		.append($('<td>').html(results.result[1] + ' <i>active</i> users'))
		.appendTo(table);

	$('<tr>')
		.append($('<td>').text('How many of those active users used ' + queryParameters.feature + '?*'))
		.append($('<td>').html(results.result[2] + ' <i>active, feature-clicking</i> users'))
		.appendTo(table);

	$('<tr>')
		.append($('<td>').text("What's that as a percentage?"))
		.append($('<td>').text(percentage + '%'))
		.appendTo(table);

	table.appendTo(el);

	var beaconHref = 'https://beacon.ft.com/graph?event_collection=cta&metric=count&group_by=meta.domPath&timeframe=this_14_days&title=Trackable%20element:%20'+ features[queryParameters.feature] +'&domPathContains='+ features[queryParameters.feature];
	$('<p>').html('<small>* These users clicked at least one <a href="' + beaconHref + '" target="_blank">"' + features[queryParameters.feature] + '" trackable element</a> in the last two weeks.</small>')
		.appendTo(el);
};

module.exports = {
	query: new Keen.Query("funnel", {
		steps:activeUserStepsForFeature(features[queryParameters.feature])
	}),
	render:renderDashboard
};
