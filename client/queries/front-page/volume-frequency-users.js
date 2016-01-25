/* global Keen, _ */
'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const moment = require('moment');

const queryParams = Object.assign(
	{
		deviceType: 'all',
		layoutType: 'all',
		timeframe: '4'
	},
	queryString.parse(location.search.substr(1))
);

const createFilter = (operator, property_name, property_value) => ({ operator, property_name, property_value });

const getFilters = (pageType) => {
	let filters = [{
		operator: 'exists',
		property_name: 'user.uuid',
		property_value: true
	}];

	if (queryParams.deviceType && queryParams.deviceType !== 'all') {
		filters.push(createFilter('eq', 'deviceAtlas.primaryHardwareType', queryParams.deviceType))
	}

	if (queryParams.layoutType && queryParams.layoutType !== 'all') {
		const layouts = [queryParams.layoutType];

		if(queryParams.layoutType === 'XL') {
			layouts.push('XXL')
		}

		filters.push(createFilter('in', 'ingest.user.layout', layouts))
	}

	if (pageType) {
		filters.push(createFilter('eq', 'page.location.type', pageType))
	}
	return filters;
};

const createTimestamp = daysAgoNum => {
	const timestamp = convertToTimestamp(daysAgoNum);
	return getPrecedingSunday(timestamp);
}

const convertToTimestamp = n => { return moment.unix(moment().startOf('day').unix()-(n * 86400)).toDate(); }

const getPrecedingSunday = timestamp => {
	const diff = timestamp.getDate() - timestamp.getDay();
	return new Date(timestamp.setDate(diff));
}

const getStartDate = timeframe => {
	return createTimestamp(parseInt(timeframe) * 7);
}

const getEndDate = timeframe => {
	return createTimestamp((parseInt(timeframe) - 4) * 7);
}

const generateAverageViews = (type, queryOpts = {}) => {
	document.querySelector(`input[name="deviceType"][value="${queryParams.deviceType}"`)
		.setAttribute('checked', 'checked');

	document.querySelector(`input[name="layoutType"][value="${queryParams.layoutType}"`)
		.setAttribute('checked', 'checked');

	document.querySelector(`input[name="timeframe"][value="${queryParams.timeframe}"`)
		.setAttribute('checked', 'checked');

	let pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters('article'),
			groupBy: ['user.uuid'],
			timeframe: {
				start: getStartDate(queryParams.timeframe),
				end: getEndDate(queryParams.timeframe)
			},
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters('frontpage'),
			groupBy: ['user.uuid'],
			timeframe: {
				start: getStartDate(queryParams.timeframe),
				end: getEndDate(queryParams.timeframe)
			},
			interval: 'weekly',
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'ingest.device.spoor_session',
			eventCollection: 'dwell',
			filters: getFilters(),
			groupBy: ['user.uuid'],
			timeframe: {
				start: getStartDate(queryParams.timeframe),
				end: getEndDate(queryParams.timeframe)
			},
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
