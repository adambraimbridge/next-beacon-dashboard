/* global Keen */
'use strict';

var client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search);
const queryTimeframe = queryParameters.timeframe || "this_7_days";

var generateAverageViews = (el, type, state,  queryOpts = {})  => {
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
				property_name: 'ab.performanceAB',
				property_value: state
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
		var average = data.reduce(function(prev, current) {
			return prev + current.result;
		}, 0) / data.length;
		charts.get('mean')
			.data({
				result: average
			})
		.title('Mean page views per session')
			.render();
		charts.get('total')
			.data({
				result: data.length
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


	client.run([queryVisitsPerUser, queryLastVisitPerUser], function(response) {
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

var generateOptin = function(id, filters) {
	var KeenQuery = function(options) {
		var parameters = {
			eventCollection: 'optin',
			timeframe: queryTimeframe,
			targetProperty: 'user.uuid',
			groupBy: options.groupBy || 'meta.type',
			timezone: 'UTC',
			filters: filters || [],
			maxAge: 10800
		};

		// Don't pass any interval parameter if it's explicitly set to false
		if (options.interval !== false) {
			parameters['interval'] = options.interval || queryParameters.interval || 'daily';
		}

		return new Keen.Query(options.queryType || 'count_unique', parameters);
	};
	var piechart_24_hours = new Keen.Dataviz()
		.el(document.getElementById('piechart__' + id))
		.chartType('piechart')
		.colors(['#6FF187','#FF6060'])
		.title('Snapshot for variant ' + id)
		.height(250)
		.prepare();

	var piechart24HoursQuery = new KeenQuery({
		interval: false,
		timeframe: 'this_24_hours'
	});

	client.run([
		piechart24HoursQuery
	], function(error, response){
		if (error) {
			throw new Error('Keen query error: ' + error.message);
		}
		else {
			piechart_24_hours
				.parseRawData({result:response.result})
				.render();
		}
	});
};

var generateOptoutReason = function(id) {
	var KeenQuery = function(options) {
		var parameters = {
			eventCollection: 'optin',
			timeframe: queryTimeframe,
			targetProperty: 'user.uuid',
			groupBy: 'meta.reason',
			timezone: 'UTC',
			filters: [{
				property_name:'meta.reason',
				operator:'exists',
				property_value:true
			},
			{
				property_name:'meta.reason',
				operator:'not_contains',
				property_value:'unknown'
			},
			{
				property_name:'meta.reason',
				operator:'not_contains',
				property_value:'other'
			},{
				operator: 'eq',
				property_name: 'ab.performanceAB',
				property_value: id
			}],
			maxAge: 10800
		};

		// Don't pass any interval parameter if it's explicitly set to false
		if (options.interval !== false) {
			parameters['interval'] = options.interval || queryParameters.interval || 'daily';
		}

		return new Keen.Query(options.queryType || 'count_unique', parameters);
	};
	var optOutChart = new Keen.Dataviz()
		.el(document.getElementById("optout__" + id))
		.chartType("metric")
		.title('Percentage of opt outs that are too-slow for variant ' + id)
		.height(140)
		.prepare();

	var optOutReasonQuery = new KeenQuery({
		queryType: 'count',
		interval: false,
	});

	client.run([
		optOutReasonQuery
	], function(error, response){
		var total = response.result.reduce(function(prev, current) {
			return prev + current.result;
		}, 0);
		var slowTotal = response.result.find(function(item) {
			return item['meta.reason'] === 'too-slow';
		}).result;
		if (error) {
			throw new Error('Keen query error: ' + error.message);
		}
		else {
			optOutChart
				.data({
					result: parseFloat(((100 / total) * slowTotal).toFixed(1))
				})
				.render();
		}
	});
};

module.exports = {
	render : function() {
		var el = document.getElementById('charts');

		generateAverageViews(el, 'page views', 'on');
		generateAverageViews(el, 'page views', 'off');
		generateFrequency(queryTimeframe, 'on', [{
			operator: 'eq',
			property_name: 'ab.performanceAB',
			property_value: 'on'
		}]);
		generateFrequency(queryTimeframe, 'off', [{
			operator: 'eq',
			property_name: 'ab.performanceAB',
			property_value: 'off'
		}]);

		generateOptin('on', [{
			operator: 'eq',
			property_name: 'ab.performanceAB',
			property_value: 'on'
		}]);
		generateOptin('off', [{
			operator: 'eq',
			property_name: 'ab.performanceAB',
			property_value: 'off'
		}]);
		generateOptoutReason('on');
		generateOptoutReason('off');
	}
};
