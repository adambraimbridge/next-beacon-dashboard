/* global Keen */
'use strict';

import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search);
const queryTimeframe  = queryParameters.timeframe || "this_14_days";

//=============================================================================================//
// MAIN
//=============================================================================================//

export function render() {
	generateAverageViewsPerSession();
}

//=============================================================================================//
// ACTIONS
//=============================================================================================//

function generateAverageViewsPerSession() {
	var slots;

	prepTheViewDataSlots()
		.then(fetchTheDataFromKeen)
		.then(calculateAverageAndTotalFromFetchedData)
		.then(figures => {
			slots.average.setDataTo(figures.average);
			slots.total.setDataTo(figures.total);
		});

	function prepTheViewDataSlots() {
		slots = {
			average	: dataVizSlot('#charts .js-average', 'Mean page views per session'),
			total	: dataVizSlot('#charts .js-total', 'Total', ['#91DCD0'])
		};

		return Promise.resolve();
	}

	function fetchTheDataFromKeen() {
		// TODO: Implement
		return new Promise(resolve => {
			setTimeout(()=> {
				resolve({});
			}, 1000)
		});
	}

	function calculateAverageAndTotalFromFetchedData() {
		// TODO: Implement
		return Promise.resolve({average:15, total:30});
	}
}

//=============================================================================================//
// UTILITIES
//=============================================================================================//

function dataVizSlot(selector, title, colors) {
	return {
		viz: new Keen.Dataviz().el(document.querySelector(selector)).title(title).prepare(),
		setDataTo(value) {
			this.viz
					.data({ result: value })
					.render();
		}
	};
}
































var generateAverageViews = (el, type, state, queryOpts = {}) => {

	const averageContainerElem = el.querySelector('.js-average');
	const average = new Keen.Dataviz().el(averageContainerElem).prepare();

	const totalContainerElem = el.querySelector('.js-total');
	const total = new Keen.Dataviz().el(totalContainerElem).prepare();

	var pageViewsQueries = [
		new Keen.Query('count', Object.assign({
			eventCollection: 'dwell',
			filters: [
				{
					operator: 'eq',
					property_name: 'ab.propensityMessaging',
					property_value: 'variant'
				},
				{
					operator: 'exists',
					property_name: 'user.uuid',
					property_value: true
				}
			],
			groupBy: 'ingest.device.spoor_session',
			timeframe: queryTimeframe,
			timezone: 'UTC'
		}, queryOpts))
	];

	client.run(pageViewsQueries, (err, results) => {
		var data = results.result;

		// remove any session > 20 page views as these are outliers
		/*
		var clean = data.filter(function (a) {
			return (a.result <= 20);
		});
		*/

		var average = clean.reduce(function(prev, current) {
			return prev + current.result;
		}, 0) / clean.length;

		var avg = 10;
		var ttl = 20;

		average
			.data({ result: avg })
			.title('Mean page views per session')
			.render();

		total
			.data({ result: ttl })
			.colors(['#91DCD0'])
			.title('Total')
			.render();
	});
};








/*
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
*/