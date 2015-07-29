/* global Keen, $ */

'use strict';

var render = function (el, results, opts) {

	var resultArray = results.result;

	var totalStreamArray = resultArray.map(function(result) {
		return result.result;
	});

	var totalStream = totalStreamArray.reduce(function(a, b) {
		return a + b;
	});

	resultArray = resultArray.sort(function(a, b) {
		return b.result-a.result;
	});

	resultArray = resultArray.splice(0,10);

	var title = $('<h2>').text("Top 10 Stream Pages Loaded");
	var table = $('<table>');

	var tr = $('<tr>')
		.append($('<th>').text('Stream Link'))
		.append($('<th>').text('Number'))
		.append($('<th>').text('% Stream Pages'));

	tr.appendTo(table);

	resultArray.map(function(result) {
		var tr = $('<tr>')
			.append($('<td>').text(result["page.location.href"]))
			.append($('<td>').text(result.result))
			.append($('<td>').text(Math.round(result.result * 100 / totalStream) + '%'));
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
			"property_value":"stream"}],
		groupBy: "page.location.href",
		targetProperty: "time.day",
		timeframe: "previous_7_days",
		timezone: "UTC"
	}),
	render: render
};
