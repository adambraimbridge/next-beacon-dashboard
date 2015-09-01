/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var engagementCohorts = require('../../lib/engagement-cohorts');

var render = (el, results) => {
	var cohortsData = engagementCohorts.extract(results);

	// create cohorts chart
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

	// create cohort chart
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
			// {
			// filter removed as deprecated (temporarily?)
			// 	operator: 'eq',
			// 	property_name: 'user.isStaff',
			// 	property_value: false
			// },
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
		timeframe: queryParameters.timeframe || 'previous_84_days',
		timezone: 'UTC'
	}),
	render: render
};
