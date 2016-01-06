/* global Keen, _ */
'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const queryTimeframe = queryParameters.timeframe || "this_8_weeks";


const getFilters = (pageType) => {
	let filters = [{
		operator: 'exists',
		property_name: 'user.ab.frontPageLayoutPrototype',
		property_value: true
	},
	{
		operator: 'exists',
		property_name: 'user.uuid',
		property_value: true
	}];

	if(queryParameters['layout']) {
		const layouts = [queryParameters['layout']];

		if(queryParameters['layout'] === 'XL') {
			layouts.push('XXL')
		}

		filters.push({
			operator: 'in',
			property_name: 'ingest.user.layout',
			property_value: layouts
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
			groupBy: ['ab.frontPageLayoutPrototype', 'user.uuid'],
			timeframe: queryTimeframe,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'user.uuid',
			eventCollection: 'dwell',
			filters: getFilters(),
			groupBy: ['ab.frontPageLayoutPrototype'],
			timeframe: queryTimeframe,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'ingest.device.spoor_session',
			eventCollection: 'dwell',
			filters: getFilters(),
			groupBy: ['ab.frontPageLayoutPrototype', 'user.uuid'],
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
			const volumeByState = _.groupBy(week.value, 'ab.frontPageLayoutPrototype');
			const visitsByState = _.groupBy(visits.result[index].value, 'ab.frontPageLayoutPrototype');
			const values = Object.keys(volumeByState).map((abState) => {
				const volume = volumeByState[abState].filter(vol => vol.result < 500); //remove outliers
				const visits = visitsByState[abState];
				const usersForState = users.result[index].value.find(usersByState => usersByState['ab.frontPageLayoutPrototype'] === abState).result;
				const atLeastNUsers = (n) => {
					const filteredVolume = volume.filter(vol => vol.result >= n);
					return (filteredVolume.length / usersForState) * 100
				};

				const meanVolume = volume.reduce(function(prev, current) {
					return prev + current.result;
				}, 0) / usersForState;

				const meanFrequency = visits.reduce(function(prev, current) {
					return prev + current.result;
				}, 0) / usersForState;

				return {
					'ab.frontPageLayoutPrototype': abState,
					'users': usersForState,
					'atLeast7': atLeastNUsers(7),
					'atLeast11': atLeastNUsers(11),
					'meanVolume': meanVolume,
					'meanFrequency': meanFrequency
				}
			});

			return {
				timeframe: week.timeframe,
				value: values
			};
		})
		.filter((week) => week.value[0].users >= 100); //exclude weeks pre ab test

		charts.get('meanVolume')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week.value.map(state => ({
						category: state['ab.frontPageLayoutPrototype'],
						result: state['meanVolume']
					}))
				}))
			})
		.title('Average volume of articles read')
		.render();

		charts.get('meanFrequency')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week.value.map(state => ({
						category: state['ab.frontPageLayoutPrototype'],
						result: state['meanFrequency']
					}))
				}))
			})
		.title('Average number of visits')
		.render();

		charts.get('users')
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week.value.map(state => ({
						category: state['ab.frontPageLayoutPrototype'],
						result: state['users']
					}))
				}))
			})
		.title('Number of users')
		.render();


		[7, 11].map((n) => {
			charts.get('atLeast' + n)
			.data({
				result: data.map((week) => ({
					timeframe: week.timeframe,
					value: week.value.map(state => ({
						category: state['ab.frontPageLayoutPrototype'],
						result: state['atLeast' + n]
					}))
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
