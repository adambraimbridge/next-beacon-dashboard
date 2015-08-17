/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var render = (el, results, opts) => {
	var weeks = [];
	// in days
	var groupSize = 14;
	// pull out days
	results.result
		.map(result => result['time.day'])
		.filter((day, index, days) => days.indexOf(day) === index)
		.sort()
		.reverse()
		.forEach((day, index) => {
			if (index % groupSize === 0) {
				weeks.unshift({
					periodEnd: day,
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
		// change the data to the format it expects
		.data({
			result: weeks.map(week => {
				return {
					value: week.buckets.map(bucket => {
						return {
							result: bucket.percentage.toFixed(2),
							label: bucket.name
						};
					}),
					timeframe: {
						end: week.periodEnd
					}
				};
			})
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
		timeframe: queryParameters.timeframe || 'previous_70_day',
		timezone: 'UTC'
	}),
	render: render
};
