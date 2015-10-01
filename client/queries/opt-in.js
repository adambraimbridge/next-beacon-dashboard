/* global Keen */

'use strict';

var client = require('../lib/wrapped-keen');

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

// This is a base query object, for spawning queries.
var keenQuery = function(options) {
	var parameters = {
		eventCollection: 'optin',
		timeframe: options.timeframe || queryParameters.timeframe || 'this_14_days',
		targetProperty: 'user.uuid',
		groupBy: options.groupBy || 'meta.type',
		timezone: 'UTC',
		filters:options.filters || [],
		maxAge: 10800
	};

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || 'daily';
	}

	return new Keen.Query(options.queryType || 'count_unique', parameters);
};

// --
// Pie charts
// --
var piechart = new Keen.Dataviz()
	.el(document.getElementById('piechart'))
	.chartType('piechart')
	.colors(['#6FF187','#FF6060'])
	.height(250)
	.prepare();

var piechart_24_hours = new Keen.Dataviz()
	.el(document.getElementById('piechart_24_hours'))
	.chartType('piechart')
	.colors(['#6FF187','#FF6060'])
	.title('24 hour snapshot')
	.height(250)
	.prepare();

var piechartQuery = new keenQuery({
	interval: false
});

var piechart24HoursQuery = new keenQuery({
	interval: false,
	timeframe: 'this_24_hours'
});

client.run([
	piechartQuery,
	piechart24HoursQuery
], function(error, response){
	if (error) {
		throw new Error('Keen query error: ' + error.message);
	}
	else {
		var piechartResponse = response[0];
		var piechart24HoursResponse = response[1];

		// Cosmetic tweak for pie chart's title
		var humanTimeframe = queryParameters.timeframe || 'This 14 days';
		humanTimeframe = humanTimeframe.charAt(0).toUpperCase() + humanTimeframe.slice(1);
		humanTimeframe = humanTimeframe.replace(/_/gi,' ');

		piechart
			.parseRawData({result:piechartResponse.result})
			.title(humanTimeframe)
			.render();

		piechart_24_hours
			.parseRawData({result:piechart24HoursResponse.result})
			.render();
	}
});


// --
// Line/area/column/bar charts
// --
var linechart = new Keen.Dataviz()
	.el(document.getElementById('linechart'))
	.chartType('linechart')
	.chartOptions({
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Approximate flow over time (in total numbers)')
	.height(450)
	.prepare();

var areachart_stacked = new Keen.Dataviz()
	.el(document.getElementById('areachart_stacked'))
	.chartType('areachart')
	.chartOptions({
		isStacked: 'percent',
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Approximate flow over time (by percentage share)')
	.height(450)
	.prepare();

var columnchart = new Keen.Dataviz()
	.el(document.getElementById('columnchart'))
	.chartType('columnchart')
	.chartOptions({
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Daily totals')
	.height(450)
	.prepare();

var barchart_stacked = new Keen.Dataviz()
	.el(document.getElementById('barchart_stacked'))
	.chartType('barchart')
	.chartOptions({
		isStacked:'percent',
		vAxis: {
			format: 'E d'
		},
		hAxis: {
			textPosition: 'none'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Daily totals by percentage share')
	.height(500)
	.prepare();

var intervalQuery = keenQuery({});
client.run(intervalQuery, function(error, response){
	if (error) {
		throw new Error('Keen query error: ' + error.message);
	}
	else {
		linechart
			.parseRequest(this)
			.sortGroups('desc')
			.render();

		areachart_stacked
			.parseRequest(this)
			.sortGroups('desc')
			.render();

		columnchart
			.parseRequest(this)
			.sortGroups('desc')
			.render();

		barchart_stacked
			.parseRequest(this)
			.sortGroups('desc')
			.render();
	}
});


// --
// Show the breakdown of opt-out reasons
// --
var table = new Keen.Dataviz()
	.el(document.getElementById('table'))
	.chartType('table')
	.chartOptions({
		width:'100%',
		height:'500',
		sortAscending:false,
		sortColumn:1
	})
	.prepare();

var optOutReasonQuery = new keenQuery({
	queryType: 'count',
	interval: false,
	groupBy: 'meta.reason',
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
	}]
});

client.run(optOutReasonQuery, function(error, response){
	if (error) {
		throw new Error('Keen query error: ' + error.message);
	}
	else {

		// COMPLEX:Strip the timeframe from (cached?) query results because,
		// if it's provided, it breaks the table format
		if (response.result.length === 1 && response.result[0].timeframe) {
			response.result = response.result[0].value;
		}
		table
			.parseRequest(this)
			.render();
	}
});

// Subset of opt-out reasons: Difficult navigation
var barchart_stacked_difficult_navigation = new Keen.Dataviz()
	.el(document.getElementById('barchart_stacked_difficult_navigation'))
	.chartType('barchart')
	.chartOptions({
		isStacked:'percent',
		vAxis: {
			format: 'E d'
		},
		hAxis: {
			textPosition: 'none'
		},
		chartArea: {
			left: '10%',
			width: '65%'
		}
	})
	.title('Daily opt-outs where the reason is "Difficult navigation"')
	.height(500)
	.prepare();

var optOutReasonByNavigationQuery = new keenQuery({
	groupBy: 'meta.difficultNavReason',
	filters: [{
		property_name:'meta.reason',
		operator:'eq',
		property_value:'difficult-nav'
	},
	{
		property_name:'meta.difficultNavReason',
		operator:'not_contains',
		property_value:'unknown'
	},
	{
		property_name:'meta.difficultNavReason',
		operator:'not_contains',
		property_value:'other'
	}]
});

client.run(optOutReasonByNavigationQuery, function(error, response){
	if (error) {
		throw new Error('Keen query error: ' + error.message);
	}
	else {
		barchart_stacked_difficult_navigation
			.parseRequest(this)
			.render();
	}
});
