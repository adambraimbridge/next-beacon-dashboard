/* global Keen, $, _ */

'use strict';

var humanize = require('humanize');

// Return the ISO string for relative dates
var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

var query = new Keen.Query("count_unique", {
	target_property: "user.uuid",
	eventCollection: "dwell",
	filters: [{"operator":"eq","property_name":"page.location.type","property_value":"search"}],
	groupBy: "page.location.search.q",
	interval: "weekly",
	targetProperty: "user.erights",
	timeframe: "this_2_months",
	timezone: "UTC",
	maxAge: 10800
});

// The results of the query comes as an array of objects,
// each one representing a week. The first object is the
// first week of the previous month, and the last object is the
// last week of the current month — even if you're in week 1.
var render = function (el, results) {
	var thisWeek;
	var lastWeek;
	var today = daysFromNow();
	var oneWeekAgo = daysFromNow(-7);

	var previousMonth = { timeframe:{}, value:{} };
	var d = new Date();
	d.setHours(0,0,0,0);
	d.setDate(0); // The last day of the previous month
	previousMonth.timeframe.end = d.toISOString();
	previousMonth.number = d.getMonth();
	d.setDate(1); // The first day of the previous month
	previousMonth.timeframe.start = d.toISOString();

	results.result.forEach(function(week) {
		if (week.timeframe.start <= today && week.timeframe.end >= today) {
			thisWeek = week;
			thisWeek.value.sort(function(a, b) {
				return a.result - b.result;
			}).reverse();
		} else if (week.timeframe.start <= oneWeekAgo && week.timeframe.end >= oneWeekAgo) {
			lastWeek = week;
			lastWeek.value.sort(function(a, b) {
				return a.result - b.result;
			}).reverse();
		} else {
			var date = new Date(week.timeframe.start);
			if (date.getMonth() === previousMonth.number){

				// Merge the week-chunks into a month, summing the value results
				previousMonth.value = _.merge(week.value, previousMonth.value, function(a, b) {
					a.result = a.result + b.result;
					return a;
				});
			}
		}
	});
	previousMonth.value.sort(function(a, b) {
		return a.result - b.result;
	}).reverse();

	var table = $('<table>');
	$('<tr>')
		.append($('<td>').attr('colspan',2).html('<b>This week</b> (' + humanize.date('D jS', new Date(thisWeek.timeframe.start)) + ' — ' + humanize.date('D jS', new Date(thisWeek.timeframe.end)) + ')'))
		.append($('<td>').attr('colspan',2).html('<b>Last week</b> (' + humanize.date('D jS', new Date(lastWeek.timeframe.start)) + ' — ' + humanize.date('D jS', new Date(lastWeek.timeframe.end)) + ')'))
		.append($('<td>').attr('colspan',2).html('<b>Last month</b> (' + humanize.date('D jS M', new Date(previousMonth.timeframe.start)) + ' — ' + humanize.date('D jS M', new Date(previousMonth.timeframe.end)) + ')'))
		.appendTo(table);

	for(var i=0; i<40; i++){
		$('<tr>')
			// This week
			.append($('<td>')
				.append($('<a>')
					.attr({'target':'_blank','href':'http://next.ft.com/search?q='+thisWeek.value[i]['page.location.search.q']})
					.text(thisWeek.value[i]['page.location.search.q'])))
			.append($('<td>').text('(' + thisWeek.value[i].result + ')'))

			// Last week
			.append($('<td>')
				.append($('<a>')
					.attr({'target':'_blank','href':'http://next.ft.com/search?q='+lastWeek.value[i]['page.location.search.q']})
					.text(lastWeek.value[i]['page.location.search.q'])))
			.append($('<td>').text('(' + lastWeek.value[i].result + ')'))

			// Last month
			.append($('<td>')
				.append($('<a>')
					.attr({'target':'_blank','href':'http://next.ft.com/search?q='+previousMonth.value[i]['page.location.search.q']})
					.text(previousMonth.value[i]['page.location.search.q'])))
			.append($('<td>').text('(' + previousMonth.value[i].result + ')'))

			.appendTo(table);
	}
	table.appendTo(el);
};

module.exports = {
	query:query,
	render:render
};
