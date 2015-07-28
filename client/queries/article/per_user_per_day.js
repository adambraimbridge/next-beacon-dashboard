/* global Keen, $ */

'use strict';

var daysAgo = function (n) {
	var d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
};

var render = function (el, results, opts) {

	var resultArray = results.result.map(function(result) {
		return result.result;
	});

	var subscribers = resultArray.length;

	var buckets = [
		{bMin: 1, bMax: 1, bFreq: 0, bPercent: 0},
		{bMin: 2, bMax: 5, bFreq: 0, bPercent: 0},
		{bMin: 6, bMax: 10, bFreq: 0, bPercent: 0},
		{bMin: 11, bMax: 15, bFreq: 0, bPercent: 0},
		{bMin: 16, bMax: 20, bFreq: 0, bPercent: 0},
		{bMin: 21, bMax: 999, bFreq: 0, bPercent: 0}
	];

//TODO exit the loop as soon as met condition, eg. a break?
	resultArray.forEach(function(result) {
		buckets.forEach(function(bucket) {
			if (result >= bucket.bMin && result <= bucket.bMax) {
				bucket.bFreq ++;
			}
		});
	});

	var title = $('<h2>').text(opts.title);
	var table = $('<table>');

	var tr = $('<tr>')
		.append($('<th>').text('Between').attr("colspan","2"))
		.append($('<th>').text('% Subscribers'));

	tr.appendTo(table);

	buckets.map(function(bucket) {
		var tr = $('<tr>')
			.append($('<td>').text(bucket.bMin))
			.append($('<td>').text(bucket.bMax))
			.append($('<td>').text(Math.round(bucket.bFreq * 100 / subscribers) + '%'));
		tr.appendTo(table);
	});

	title.appendTo($(el));
	table.appendTo($(el));

};

module.exports.lastWeek = {

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
		groupBy: ["user.uuid", "time.day"],
		targetProperty: "time.day",
		timeframe: "previous_7_days",
		timezone: "UTC"
	}),
	render: render
};

module.exports.fourWeeksPrior = {

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
		groupBy: ["user.uuid", "time.day"],
		targetProperty: "time.day",
		timeframe: { start: daysAgo(34), end: daysAgo(28) },
		timezone: "UTC"
	}),
	render: render
};
