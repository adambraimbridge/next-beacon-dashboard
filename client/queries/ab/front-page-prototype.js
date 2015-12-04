/* global Keen */
'use strict';

var client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search);
const queryTimeframe = queryParameters.timeframe || "this_7_days";

var generateAverageViews = (el, type, state, queryOpts = {}) => {
	var pageViewsEl = document.createElement('div');
	pageViewsEl.classList.add('o-grid-row');
	pageViewsEl.innerHTML = `<h2 data-o-grid-colspan="12">Average page views per session for ${state} variant</h2>`;
	el.appendChild(pageViewsEl);

	var pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: [
				{
					operator: 'eq',
					property_name: 'ab.frontPageLayoutPrototype',
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
		var el = document.createElement('div');
		el.dataset.oGridColspan = '12 M6';
		pageViewsEl.appendChild(el);
		map.set(key, new Keen.Dataviz()
				.el(el)
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
		.title('Mean page views per session')
			.render();
		charts.get('total')
			.data({
				result: clean.length
			})
		.colors(['#91DCD0'])
			.title('Total')
			.render();
	});

};

var generateFrequency = (timeframe, id, filters=[]) => {
	var keenQuery = function(options) {
		var query = options.query || 'count_unique';
		var parameters = {
			eventCollection: options.eventCollection || "dwell",
			timeframe: queryTimeframe,
			targetProperty: options.targetProperty,
			timezone: "UTC",
			filters:options.filters || [],
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
		.el(document.getElementById("metric_average_frequency__" + id))
		.chartType("metric")
		.title(timeframe.replace(/_/g, ' ') + ' for variant ' + id)
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
		var el = document.getElementById('charts');
		generateAverageViews(el, 'page views', 'on');
		generateAverageViews(el, 'page views', 'off');

		generateFrequency(queryTimeframe, 'on', [{
			operator: 'eq',
			property_name: 'ab.frontPageLayoutPrototype',
			property_value: 'on'
		},{
			operator: 'exists',
			property_name: 'user.uuid',
			property_value: true
		}]);
		generateFrequency(queryTimeframe, 'off', [{
			operator: 'eq',
			property_name: 'ab.frontPageLayoutPrototype',
			property_value: 'off'
		},{
			operator: 'exists',
			property_name: 'user.uuid',
			property_value: true
		}]);

	}
};
