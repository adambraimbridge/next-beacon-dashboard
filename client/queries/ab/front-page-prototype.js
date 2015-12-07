/* global Keen */
'use strict';

var client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search);
const queryTimeframe = queryParameters.timeframe || "this_7_days";

var generateAverageViews = (type, state, queryOpts = {}) => {

	var pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: [
				{
					operator: 'eq',
					property_name: 'user.ab.frontPageLayoutPrototype',
					property_value: state
				},
				{
					operator: 'exists',
					property_name: 'user.uuid',
					property_value: true
				},
				{
					operator: 'eq',
					property_name: 'page.location.type',
					property_value: 'article'
				}
			],
			groupBy: 'ingest.device.spoor_session',
			timeframe: queryTimeframe,
			timezone: 'UTC'
		}, queryOpts)),
	];

	var charts = new Map([['mean'], ['total']]);
	charts.forEach((value, key, map) => {
		map.set(key, new Keen.Dataviz()
				.el(document.getElementById("metric_" + key + "_volume__" + state))
				.prepare());
	});

	client.run(pageViewsQueries, (err, results) => {
		var data = results.result;

		// remove any session > 20 page views as these are outliers
		var clean = data.filter(function (a) {
			return (a.result <= 20);
		});

		var average = clean.reduce(function(prev, current) {
			return prev + current.result;
		}, 0) / clean.length;
		charts.get('mean')
			.data({
				result: average
			})
		.title('Mean articles read per session for ' + state)
			.render();
		charts.get('total')
			.data({
				result: clean.length
			})
		.colors(['#91DCD0'])
			.title('Total articles read for ' + state)
			.render();
	});

};

var generateFrequency = (timeframe, state, filters=[]) => {
	var keenQuery = function(options) {
		var query = options.query || 'count_unique';
		var parameters = {
			eventCollection: options.eventCollection || "dwell",
			timeframe: queryTimeframe,
			targetProperty: options.targetProperty,
			timezone: "UTC",
			filters: [
				{
					operator: 'eq',
					property_name: 'user.ab.frontPageLayoutPrototype',
					property_value: state
				},
				{
					operator: 'exists',
					property_name: 'user.uuid',
					property_value: true
				},
				{
					operator: 'eq',
					property_name: 'page.location.type',
					property_value: 'article'
				}
			],
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
		.title(timeframe.replace(/_/g, ' ') + ' for ' + state)
		.height(140)
		.prepare();

	var queryLastVisitPerUser = keenQuery({
		timeframe: timeframe,
		query: 'maximum',
		targetProperty: 'time.day',
		groupBy: 'user.uuid',
		interval: false,
		filters: filters
	});

	var queryVisitsPerUser = keenQuery({
		timeframe: timeframe,
		targetProperty: 'time.day',
		groupBy: 'user.uuid',
		interval: false,
		filters: filters
	});


	client.run([queryVisitsPerUser, queryLastVisitPerUser], function() {
		var visitsPerUser = this.data[0].result;
		var totalUniqueUsers = visitsPerUser.length;

		//Work out the average days visiting the site in the timeframe
		var averageVisitsPerUser = visitsPerUser.reduce(function(memo, user) {
			return memo + user.result;
		}, 0) / totalUniqueUsers;

		metricAverageFrequency
			.parseRawData({ result:parseFloat(averageVisitsPerUser) })
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
