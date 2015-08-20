/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var render = (el, results, opts) => {
	var cohortsData = [];
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
				cohortsData.unshift({
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
					if (!count) {
						return;
					}
					var uuid = result['user.uuid'];
					var user = cohortsData[0].users[uuid];
					if (!user) {
						cohortsData[0].users[uuid] = {
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

	cohortsData.forEach(result => {
		Object.keys(result.users).forEach((uuid, index) => {
			// take our set of users from the initial period (i.e. ignore any new users)
			if (index !== 0 && !cohortsData[0].users[uuid]) {
				return delete result.users[uuid];
			}
			var averageReadCount = result.users[uuid].average;
			result.value.some((value, index) => {
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
	cohortsData.forEach(result => {
		var totalCount = result.value.reduce((prev, value) => prev + value.result, 0);
		// convert result to percentage
		result.value.forEach(value => value.result = ((100 / totalCount) * value.result).toFixed(2));
	});

	// create a chart
	var cohortsChart = new Keen.Dataviz();
	var cohortsChartEl = document.createElement('div');
	el.appendChild(cohortsChartEl);
	cohortsChart
		.el(cohortsChartEl)
		.height(500)
		.chartType('areachart')
		.stacked(true)
		.indexBy('timeframe.end')
		.chartOptions({
			pointSize: 5
		})
		.prepare()
		.data({
			result: cohortsData
		})
		.render();

	var cohortData = cohortsData.map(result => {
		var currentCohort = Object.keys(result.users).filter(uuid => result.users[uuid].average < 1.5);
		var value = currentCohort.reduce((prev, uuid) => prev + result.users[uuid].average, 0) / currentCohort.length;
		return {
			timeframe: result.timeframe,
			value
		};
	});

	var cohortChart = new Keen.Dataviz();
	var cohortChartEl = document.createElement('div');
	el.appendChild(cohortChartEl);
	cohortChart
		.el(cohortChartEl)
		.height(500)
		.title('Mean articles read per day of < 1.5 cohort')
		.indexBy('timeframe.end')
		.chartOptions({
			pointSize: 5
		})
		.prepare()
		.data({
			result: cohortData
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
			},
			{
				operator: 'exists',
				property_name: 'user.uuid',
				property_value: true
			},
			{
				operator: 'exists',
				property_name: 'time.day',
				property_value: true
			}
		],
		groupBy: ['user.uuid', 'time.day'],
		// 12 days
		timeframe: queryParameters.timeframe || 'previous_84_days',
		timezone: 'UTC'
	}),
	render: render
};
