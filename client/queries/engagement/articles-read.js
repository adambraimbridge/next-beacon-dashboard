/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var render = (el, results, opts) => {
	var weeks = [];
	// in days
	var groupSize = 14;
	var buckets = [
		{
			min: 1.5,
			label: 'At least 1.5 articles read',
		},
		{
			max: 1.5,
			label: 'Less than 1.5 articles read',
		}
	];
	// pull out days
	results.result
		.map(result => result['time.day'])
		.filter((day, index, days) => days.indexOf(day) === index)
		.sort()
		.reverse()
		.forEach((day, index) => {
			if (index % groupSize === 0) {
				weeks.unshift({
					timeframe: {
						end: day
					},
					// two buckets, < 1.5 and >= 1.5
					value: buckets.map(bucket => ({
						label: bucket.label,
						result: 0
					})),
					users: {}
				});
			}
			results.result
				.filter(result => day === result['time.day'])
				.forEach(result => {
					var count = result.result;
					if (!count) {
						return;
					}
					var user = result['user.uuid'];
					if (!weeks[0].users[user]) {
						weeks[0].users[user] = [];
					}
					weeks[0].users[user].push(count);
				});
		});

	weeks.forEach(week => {
		Object.keys(week.users).forEach(userId => {
			var averageReadCount = week.users[userId].reduce((prev, current) => prev + current) / week.users[userId].length;
			week.value.some((value, index) => {
				var bucket = buckets[index];
				if (bucket.min && averageReadCount < bucket.min) {
					return false;
				} else if (bucket.max && averageReadCount >= bucket.max) {
					return false;
				}
				value.result++;
				return true;
			});
		});
	});

	// calculate value as a percentage
	weeks.forEach(week => {
		var totalCount = week.value.reduce((prev, value) => prev + value.result, 0);
		week.value.forEach(value => {
			// convert result to percentage
			value.result = ((100 / totalCount) * value.result).toFixed(2);
		});
	});

	// create a chart
	var chart = new Keen.Dataviz();
	chart
		.el(el)
		.height(500)
		.chartType('areachart')
		.stacked(true)
		.indexBy('timeframe.end')
		.chartOptions({
			pointSize: 5
		})
		.prepare()
		.data({
			result: weeks
	 	})
	 	.render();
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
		groupBy: ['user.uuid', 'time.day'],
		// 10 weeks
		timeframe: queryParameters.timeframe || 'previous_84_days',
		timezone: 'UTC'
	}),
	render: render
};
