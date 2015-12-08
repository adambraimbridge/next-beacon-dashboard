/* global Keen, _ */
'use strict';

var client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const queryTimeframe = queryParameters.timeframe || "this_7_days";

const startDate = "2015-12-07";
const currDate = new Date().toISOString();

const colors = {
	control: '#91DCD0',
	variant: '#49c5b1'
};

const getFilters = (state, pageType) => {
	let filters = [{
		operator: 'eq',
		property_name: 'user.ab.frontPageLayoutPrototype',
		property_value: state
	},
	{
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

var generateAverageViews = (type, state, queryOpts = {}) => {

	var pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: getFilters(state, 'article'),
			groupBy: ['time.week','user.uuid'],
			timeframe: {
				start: startDate,
				end: currDate
			},
			timezone: 'UTC'
		}, queryOpts)),
		new Keen.Query('count_unique', Object.assign({
			targetProperty: 'user.uuid',
			eventCollection: 'dwell',
			filters: getFilters(state),
			groupBy: ['time.week'],
			timeframe: {
				start: startDate,
				end: currDate
			},
			timezone: 'UTC'
		}, queryOpts)),
	];

	var charts = new Map([['mean'], ['atLeast1'], ['atLeast3'], ['atLeast5'], ['atLeast7'], ['atLeast9']]);
	charts.forEach((value, key, map) => {
		map.set(key, new Keen.Dataviz()
				.el(document.getElementById("metric_" + key + "_volume__" + state))
				.prepare());
	});



	client.run(pageViewsQueries, (err, [articlesRead, users]) => {
		const byWeek = _.groupBy(articlesRead.result, 'time.week');
		const data = Object.keys(byWeek).map((week, index) => {
			const visitsForWeek = byWeek[week];

			const atLeastNUsers = (n) => {
				const filteredVisits = visitsForWeek.filter(visit => visit.result >= n);
				return (filteredVisits.length / users.result[index].result) * 100
			}

			const mean = visitsForWeek.reduce(function(prev, current) {
				return prev + current.result;
			}, 0) / users.result[index].result;
			return {
				'time.week': week,
				'atLeast1': atLeastNUsers(1),
				'atLeast3': atLeastNUsers(3),
				'atLeast5': atLeastNUsers(5),
				'atLeast7': atLeastNUsers(7),
				'atLeast9': atLeastNUsers(9),
				'mean': mean
			}
		});


		var totals = data.reduce(function(prev, current) {
			return {
				'time.week': current['time.week'],
				'atLeast1': prev['atLeast1'] + current['atLeast1'],
				'atLeast3':  prev['atLeast3'] + current['atLeast3'],
				'atLeast5':  prev['atLeast5'] + current['atLeast5'],
				'atLeast7':  prev['atLeast7'] + current['atLeast7'],
				'atLeast9':  prev['atLeast9'] + current['atLeast9'],
				'mean':  prev['mean'] + current['mean']
			};
		}, {
			'time.week': null,
			'atLeast1': 0,
			'atLeast3': 0,
			'atLeast5': 0,
			'atLeast7': 0,
			'atLeast9': 0,
			'mean': 0
		});

		var average = {
			'time.week': totals['time.week'],
			'atLeast1': totals['atLeast1'] / data.length,
			'atLeast3': totals['atLeast3'] / data.length,
			'atLeast5': totals['atLeast5'] / data.length,
			'atLeast7': totals['atLeast7'] / data.length,
			'atLeast9': totals['atLeast9'] / data.length,
			'mean': totals['mean'] / data.length
		};

		charts.get('mean')
			.data({
				result: average['mean']
			})
		.title('Mean articles read per session for ' + state)
		.colors([colors[state]])
		.render();

		[1, 3, 5, 7, 9].map((n) => {
			charts.get('atLeast' + n)
				.data({
					result: average['atLeast' + n]
				})
				.colors([colors[state]])
				.title('% reading at least ' + n + ' article(s) for ' + state)
				.render();

		})


	});

};

var generateFrequency = (timeframe, state) => {
	var keenQuery = function(options) {
		var query = options.query || 'count_unique';
		var parameters = {
			eventCollection: options.eventCollection || "dwell",
			timeframe: 'this_7_days',
			targetProperty: options.targetProperty,
			timezone: "UTC",
			filters: getFilters(state),
			maxAge: 10800
		};

		if (options.groupBy) {
			parameters['groupBy'] = options.groupBy;
		}

		// Don't pass any interval parameter if it's explicitly set to false
		if (options.interval !== false) {
			parameters['interval'] = options.interval || queryParameters.interval || "daily";
		}

		return new Keen.Query(query, parameters);
	};
	var metricAverageFrequency = new Keen.Dataviz()
		.el(document.getElementById("metric_average_frequency__" + state))
		.chartType("metric")
		.title('visits this week for ' + state)
		.height(140)
		.prepare();


	var queryTotalUsers = keenQuery({
		timeframe: timeframe,
		query: 'count_unique',
		targetProperty: 'user.uuid',
		interval: false
	});

	var queryVisitsPerUser = keenQuery({
		timeframe: timeframe,
		targetProperty: 'ingest.device.spoor_session',
		groupBy: 'user.uuid',
		interval: false
	});


	client.run([queryVisitsPerUser, queryTotalUsers], function() {
		var visitsPerUser = this.data[0].result;
		var totalUniqueUsers = this.data[1].result;

		//Work out the average days visiting the site in the timeframe
		var averageVisitsPerUser = _.reduce(visitsPerUser, function(memo, user) {
			return memo + user.result;
		}, 0) / totalUniqueUsers;

		metricAverageFrequency
		.parseRawData({ result:parseFloat(averageVisitsPerUser) })
		.colors([colors[state]])
		.render();

	});


};

module.exports = {
	render : function() {
		generateAverageViews('page views', 'control');
		generateAverageViews('page views', 'variant');

		generateFrequency(queryTimeframe, 'control');
		generateFrequency(queryTimeframe, 'variant');

	}
};
