/* global Keen, $ */

'use strict';

var render = function (el, results, opts) {

	var resultArray = [];

	results.result.map(function(result) {
		resultArray.push({articles: result.result, week: result["time.week"]});
	});

	var flagsWeeks = [];
	var weeks = [];

	resultArray.forEach(function(result) {
		if (flagsWeeks[result.week]) {
			return;
		}
		flagsWeeks[result.week] = true;
		weeks.push(result.week);
	});

	var weeksSummary = [];

	weeks.forEach(function(week) {
		weeksSummary.push({week: week,
			subscribers: resultArray.filter(function(result) {
										return result.week === week;
									}).length
		});
	});

	var weeksBuckets = [];

	weeks.forEach(function(week) {
		weeksBuckets.push({week: week, bucket: [
			{bMin: 1, bMax: 1, bFreq: 0, bPercent: 0},
			{bMin: 2, bMax: 2, bFreq: 0, bPercent: 0},
			{bMin: 3, bMax: 3, bFreq: 0, bPercent: 0},
			{bMin: 4, bMax: 6, bFreq: 0, bPercent: 0},
			{bMin: 7, bMax: 9, bFreq: 0, bPercent: 0},
			{bMin: 10, bMax: 19, bFreq: 0, bPercent: 0},
			{bMin: 20, bMax: 999, bFreq: 0, bPercent: 0}
		]});
	});

	resultArray.forEach(function(result) {
		weeksBuckets.forEach(function(weekBucket){
			if (result.week === weekBucket.week) {
				weekBucket.bucket.forEach(function(bucket) {
					if (result.articles >= bucket.bMin && result.articles <= bucket.bMax) {
						bucket.bFreq ++;
					}
				});
			}
		});
	});

	weeksBuckets.forEach(function(weekBucket) {
		var weekSubscribers = weeksSummary.filter(function(weekSummary) {
			return weekBucket.week === weekSummary.week;
		})[0].subscribers;
		weekBucket.bucket.forEach(function(bucket) {
			bucket.bPercent = bucket.bFreq / weekSubscribers;
		});
	});

	var title = $('<h2>').text('Trend of article views by subscriber by day');
	var table = $('<table>');

	var tr = $('<tr>')
		.append($('<th>').text('Week'))
		.append($('<th>').text('Articles loaded by subscriber in a day').attr("colspan", "7"));

	tr.appendTo(table);

	tr = $('<tr>')
		.append($('<th>').text('Latest top'))
		.append($('<th>').text('1'))
		.append($('<th>').text('2'))
		.append($('<th>').text('3'))
		.append($('<th>').text('4 to 6'))
		.append($('<th>').text('7 to 9'))
		.append($('<th>').text('10 to 19'))
		.append($('<th>').text('20+'));

	tr.appendTo(table);

	weeksBuckets = weeksBuckets.sort(function(a, b) {
		return b.week-a.week;
	});

	weeksBuckets.map(function(weekBucket) {
		tr = $('<tr>')
			.append($('<td>').text(weekBucket.week));
		weekBucket.bucket.forEach(function(bucket) {
			tr.append($('<td>').text(Math.round(bucket.bPercent * 100) + '%'));
		});
		tr.appendTo(table);
	});

	title.appendTo($(el));
	table.appendTo($(el));

};

module.exports = {

	query: new Keen.Query("count", {
		eventCollection: "dwell",
		filters: [
			{"operator":"eq",
			"property_name":"user.isStaff",
			"property_value":false},
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"article"}
		],
		groupBy: ["user.uuid", "time.day", "time.week"],
		targetProperty: "time.day",
		timeframe: "previous_8_weeks",
		timezone: "UTC"
	}),
	render: render
};
