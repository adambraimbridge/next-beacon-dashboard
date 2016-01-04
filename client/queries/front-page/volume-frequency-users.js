/* global Keen, _ */
'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));

const breakpoints = ['all', 'default', 'XS', 'S', 'M', 'L', 'XL'];
const timeframes = ['2', '4', '6', '8'];

const currentBreakpoint = queryParameters['layout'] || breakpoints[0];
const currentTimeframe = queryParameters['timeframe'] || timeframes[0];

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
		});
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

	const el = document.getElementById('charts');
	const optionsEl = document.createElement('div');
	optionsEl.classList.add('nav--horizontal');
	optionsEl.dataset.oGridColspan = '12';

	const breakpointItems = breakpoints
		.map(breakpoint =>
			breakpoint === currentBreakpoint
				? `<li>${breakpoint}</li>`
				: breakpoint === 'all'
					? `<li><a href="?timeframe=${currentTimeframe}">${breakpoint}</a></li>`
					: `<li><a href="?layout=${breakpoint}&amp;timeframe=${currentTimeframe}">${breakpoint}</a></li>`
		)
		.join('');

	const timeframeItems = timeframes
		.map(timeframe =>
			timeframe === currentTimeframe
				? `<li>${timeframe}</li>`
				: currentBreakpoint === 'all'
					? `<li><a href="?timeframe=${timeframe}">${timeframe}</a></li>`
					: `<li><a href="?layout=${currentBreakpoint}&amp;timeframe=${timeframe}">${timeframe}</a></li>`
		)
		.join('');

	optionsEl.innerHTML = `
		<h3>Breakpoint: </h3>
		<ul>${breakpointItems}</ul>
		</br>
		<h3>Timeframe (weeks): </h3>
		<ul>${timeframeItems}</ul>
	`;
	el.insertBefore(optionsEl, el.firstChild);

	let pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters('article'),
			groupBy: ['user.uuid'],
			timeframe: `this_${currentTimeframe}_weeks`,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters('frontpage'),
			groupBy: ['user.uuid'],
			timeframe: `this_${currentTimeframe}_weeks`,
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'ingest.device.spoor_session',
			eventCollection: 'dwell',
			filters: getFilters(),
			groupBy: ['user.uuid'],
			timeframe: `this_${currentTimeframe}_weeks`,
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

	client.run(pageViewsQueries, (err, [articlesRead, frontPageUsers, visits]) => {
		const data = articlesRead.result
		.map((week, index) => {
			const minFrontPageViews = frontPageUser => frontPageUser.result > 1;
			const frontPageUsersForWeek = frontPageUsers.result[index].value.filter(minFrontPageViews);
			const frontPageUsersForWeekNum = frontPageUsersForWeek.length;

			const visitsForWeek = visits.result[index].value;

			const articleUsersForWeek = week.value.filter(vol => vol.result < 500);
			const lookup = _.indexBy(frontPageUsersForWeek, function(frontPageUser) { return frontPageUser['user.uuid'] });
			const volumeForWeek = _.filter(articleUsersForWeek, function(articleUser) {
				return lookup[articleUser['user.uuid']] !== undefined;
			});

			const atLeastNUsers = (n) => {
				const filteredVolume = volumeForWeek.filter(vol => vol.result >= n);
				return (filteredVolume.length / frontPageUsersForWeekNum) * 100
			};

			const meanVolume = volumeForWeek.reduce(function(prev, current) {
				return prev + current.result;
			}, 0) / frontPageUsersForWeekNum;

			const meanFrequency = visitsForWeek.reduce(function(prev, current) {
				return prev + current.result;
			}, 0) / frontPageUsersForWeekNum;

			return {
				'timeframe': week.timeframe,
				'users': frontPageUsersForWeekNum,
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
			.title('Number of home page users')
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
