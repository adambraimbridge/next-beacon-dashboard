/* global Keen, _ */
'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const queryTimeframe = queryParameters.timeframe || "this_8_weeks";

const getFilters = (pageType) => {
	let filters = [{
		operator: 'exists',
		property_name: 'user.uuid',
		property_value: true
	}];

	if(queryParameters['layout']) {
		filters.push({
			operator: 'eq',
			property_name: 'ingest.user.layout',
			property_value: queryParameters['layout']
    })
	}

	if(pageType) {
		filters.push({
			operator: 'eq',
			property_name: 'page.location.type',
			property_value: pageType
		});
	}
	return filters;
};

const generateAverageViews = (type, queryOpts = {}) => {

	let pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters('article'),
			groupBy: ['user.uuid'],
			timeframe: queryTimeframe,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'user.uuid',
			eventCollection: 'dwell',
			filters: getFilters(),
			timeframe: queryTimeframe,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'ingest.device.spoor_session',
			eventCollection: 'dwell',
			filters: getFilters(),
			groupBy: ['user.uuid'],
			timeframe: queryTimeframe,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts))
	];

	const charts = new Map([['meanVolume'], ['atLeast7'], ['atLeast11'], ['meanFrequency'], ['users']]);
	charts.forEach((value, key, map) => {
		map.set(key, new Keen.Dataviz()
				.chartType('linechart')
				.chartOptions({
					height: 500,
					width: '100%',
					legend: {
						position: 'in'
					}
				})
				.el(document.getElementById("metric_" + key ))
				.prepare());
	});

	client.run(pageViewsQueries, (err, [articlesRead, users, visits ]) => {
		const data = articlesRead.result
		.map((week, index) => {
			const usersForWeek = users.result[index].value;
			const visitsForWeek = visits.result[index].value;
			const volumeForWeek = week.value.filter(vol => vol.result < 500); //remove outliers

			const atLeastNUsers = (n) => {
				const filteredVolume = volumeForWeek.filter(vol => vol.result >= n);
				return (filteredVolume.length / usersForWeek) * 100
			};

			const meanVolume = volumeForWeek.reduce(function(prev, current) {
				return prev + current.result;
			}, 0) / usersForWeek;

			const meanFrequency = visitsForWeek.reduce(function(prev, current) {
				return prev + current.result;
			}, 0) / usersForWeek;

			return {
				'timeframe': week.timeframe,
				'users': usersForWeek,
				'atLeast7': atLeastNUsers(7),
				'atLeast11': atLeastNUsers(11),
				'meanVolume': meanVolume,
				'meanFrequency': meanFrequency
			}
		});

		charts.get('meanVolume')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week['meanVolume']
				}))
			})
			.title('Average volume of articles read')
			.render();

		charts.get('meanFrequency')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week['meanFrequency']
				}))
			})
			.title('Average number of visits')
			.render();

		charts.get('users')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week['users']
				}))
			})
			.title('Number of users')
			.render();

		[7, 11].map((n) => {
			charts.get('atLeast' + n)
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week['atLeast' + n]
				}))
			})
			.title('% reading at least ' + n + ' article(s) ')
			.render();
		})
	});
};

module.exports = {
	render : generateAverageViews
};
