/* global Keen, $, _ */

'use strict';

var daysAgo = function (n) {
	var d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
};

var render = function (el, results, opts) {

		console.log(results);

		var a = _.map(results.result, function(item) {
			return item.result;
		});

		var b = _.groupBy(a, function(el) {
			return el;
		});

		var c = _.map(b, function(el, key) {
			return {
				group_by: key,
				length: el.length
			};
		});

		// sum the total number of users
		var sum = _.sum(c, function(el) {
			return el.length;
		});

		// Calculate number of users as a % of the total
		var e = _.map(c, function(el) {
			el.percentage = (el.length / sum) * 100;
			return el;
		});

		var cumulative = 0.0;
		_.map(e.slice().reverse(), function(el, index) { // slice.reverse = non mutated reverse
			cumulative += el.percentage;
			e[(e.length - 1) - index].cumulative = cumulative;
			console.log(el, index, el.percentage, cumulative, e[index].cumulative);
			return el;
		});

		console.log(e);

		var title = $('<h2>').text(opts.title);
		var table = $('<table>');
		table.addClass('addiction__table');

		var tr = $('<tr>')
			.append($('<th>').text('Frequency'))
			.append($('<th>').text('Unique users seen'))
			.append($('<th>').text('%'))
			.append($('<th>').text('% (Cumulative)'));

		tr.appendTo(table);

		e.map(function(row) {
			var tr = $('<tr>')
				.append($('<td>').text(row.group_by))
				.append($('<td>').text(row.length))
				.append($('<td>').text(Math.round(row.percentage) + '%'))
				.append($('<td>').text(Math.round(row.cumulative) + '%'));
			tr.appendTo(table);
		});

		title.appendTo($(el));
		table.appendTo($(el));
};

module.exports.thisWeek = {

	query: new Keen.Query('count_unique', {
			timeframe: { start: daysAgo(8), end: daysAgo(1) }, // today will always be skwed, so start from a yesterday
			target_property: 'time.day',
			event_collection: 'dwell',
			group_by: ['user.uuid'],
			maxAge: 10800
		}),

	render: render

};

module.exports.lastWeek = {

	query: new Keen.Query('count_unique', {
			timeframe: { start: daysAgo(14), end: daysAgo(7) },
			target_property: 'time.day',
			event_collection: 'dwell',
			group_by: ['user.uuid'],
			maxAge: 10800
		}),

	render: render

};

module.exports.thisTimeLastMonth = {

	query: new Keen.Query('count_unique', {
			timeframe: { start: daysAgo(35), end: daysAgo(28) },
			target_property: 'time.day',
			event_collection: 'dwell',
			group_by: ['user.uuid'],
			maxAge: 10800
		}),

	render: render

};

module.exports.weekly = {

	query: new Keen.Query('count_unique', {
			timeframe: { start: daysAgo(22), end: daysAgo(1) },
			target_property: 'time.week',
			event_collection: 'dwell',
			group_by: ['user.uuid'],
			maxAge: 10800
		}),

	render: render

};

module.exports.weeklyThisTimeLastMonth = {

	query: new Keen.Query('count_unique', {
			timeframe: { start: daysAgo(49), end: daysAgo(28) },
			target_property: 'time.week',
			event_collection: 'dwell',
			group_by: ['user.uuid'],
			maxAge: 10800
		}),

	render: render

};
