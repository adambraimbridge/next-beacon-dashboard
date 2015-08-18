/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var render = (el, results, opts) => {
	var data = [];
	// in days
	var groupSize = 14;
	// two buckets, < 1.5 and >= 1.5
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
				data.unshift({
					timeframe: {
						end: day
					},
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
					var uuid = result['user.uuid'];
					if (!count || !uuid) {
						return;
					}
					var user = data[0].users[uuid];
					if (!user) {
						data[0].users[uuid] = {
							average: count,
							totalDays: 1
						};
					} else {
						// update average
						var newTotalDays = user.totalDays + 1;
						user.average = ((user.average * user.totalDays) + count) / newTotalDays;
						user.totalDays = newTotalDays;
					}
				});
		});

	data.forEach(week => {
		Object.keys(week.users).forEach(userId => {
			var averageReadCount = week.users[userId].average;
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
	data.forEach(week => {
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
			result: data
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
		// 12 data
		timeframe: queryParameters.timeframe || 'previous_84_days',
		timezone: 'UTC'
	}),
	render: render
};
