/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var timeframe = queryParameters.timeframe || 'previous_84_days';

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

	// create query for referrers
	var latestUsers = data.slice(-1)[0].users;
	buckets.forEach(bucket => {
		var users = Object.keys(latestUsers).filter(uuid => {
			var user = latestUsers[uuid];
			if (bucket.min && user.average < bucket.min) {
				return false;
			} else if (bucket.max && user.average >= bucket.max) {
				return false;
			}
			return true;
		});
		var query = new Keen.Query('count', {
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
					operator: 'in',
					property_name: 'user.uuid',
					property_value: users
				},
				{
					operator: 'exists',
					property_name: 'page.referrer.hostname',
					property_value: true
				}

			],
			groupBy: 'page.referrer.hostname',
			timeframe: timeframe,
			timezone: 'UTC'
		});
		require('../../lib/wrapped-keen').run(query, (err, results) => {
			// order, and take the top 10
			var data = results.result
				.filter(result => !result['page.referrer.hostname'].endsWith('.ft.com'))
				.sort((resultOne, resultTwo) => resultTwo.result - resultOne.result)
				.slice(0, 10);
			// create a chart
			var chart = new Keen.Dataviz();
			var chartEl = document.createElement('div');
			el.appendChild(chartEl);
			chart
				.el(chartEl)
				.height(500)
				.title(`${bucket.label} referrers`)
				.chartOptions({
					pointSize: 5
				})
				.prepare()
				.data({
					result: data
				})
				.render();
		});
	});
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
		timeframe: timeframe,
		timezone: 'UTC'
	}),
	render: render
};
