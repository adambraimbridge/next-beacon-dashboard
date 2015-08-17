/* global Keen, $ */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var moment = require('moment');

var render = (el, results, opts) => {
	var weeks = [];
	// in days
	var groupSize = 7;
	// take groups of x days
	results.result.reverse().forEach((result, index) => {
		if (index % groupSize === 0) {
			weeks.unshift({
				weekEnd: result.timeframe.end,
				// two buckets, < 1.5 and >= 1.5
				buckets: [
					{
						min: 1.5,
						name: '>= 1.5',
						value: 0
					},
					{
						max: 1.5,
						name: '< 1.5',
						value: 0
					}
				],
				users: {}
			});
		}
		result.value.forEach(value => {
			var count = value.result;
			if (!count) {
				return;
			}
			var user = value['user.uuid'];
			if (!weeks[0].users[user]) {
				weeks[0].users[user] = [];
			}
			weeks[0].users[user].push(value.result);
		});
	});

	weeks.forEach(week => {
		Object.keys(week.users).forEach(userId => {
			var averageReadCount = week.users[userId].reduce((prev, current) => prev + current) / week.users[userId].length;
			week.buckets.some(bucket => {
				if (bucket.min && averageReadCount < bucket.min) {
					return false;
				} else if (bucket.max && averageReadCount >= bucket.max) {
					return false;
				}
				bucket.value++;
				return true;
			});
		});
	});

	// calculate value as a percentage
	weeks.forEach(week => {
		var totalCount = week.buckets.reduce((prev, bucket) => prev + bucket.value, 0);
		week.buckets.forEach(bucket => bucket.percentage = (100 / totalCount) * bucket.value);
	});

	var tableHead = $('<thead>');
	var tableHeadRow = $('<tr>')
		.append($('<th>').text(''));
	weeks.forEach(week => {
		tableHeadRow.append($('<th>').text(moment(week.weekEnd).format('MMMM Do YYYY')));
	});
	tableHead.append(tableHeadRow);

	var tableBody = $('<tbody>');
	// pull out a bucket definition
	weeks[0].buckets.forEach(bucket => {
		var tableBodyRow = $('<tr>')
			.append($('<td>').text(bucket.name));
		weeks.forEach(week => {
			var percentage = week.buckets.find((b) => b.name === bucket.name).percentage.toFixed(2);
			tableBodyRow.append($('<td>').text(`${percentage}%`));
		});
		tableBody.append(tableBodyRow);
	});

	$('<table>')
		.append(tableHead)
		.append(tableBody)
		.appendTo(el);
};

module.exports = {
	query: new Keen.Query('count', {
		eventCollection: 'dwell',
		filters: [
			{
				operator: 'eq',
				property_name: 'user.isStaff',
				property_value: false
			},
			{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'article'
			}
		],
		groupBy: 'user.uuid',
		timeframe: queryParameters.timeframe || 'previous_14_day',
		interval: 'daily',
		timezone: 'UTC'
	}),
	render: render
};
