/* global Keen */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var offset = parseInt(queryParameters.offset) || 0;


var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

var labels = [
	'Visited Next',
	'Is a myFT user'
];


function getDashboard(start, end) {
	// This is a base step object, for spawning steps.
	var step = function(options) {
		return {
			eventCollection:options.eventCollection || "dwell",
			actor_property:"user.uuid",
			timeframe:  {
				start: start,
				end: end
			},
			filters:options.filters || [],
		};
	};

	return {
		'title' : 'Overall usage of myFT',
		'labels' : labels,
		'steps':[

			step({}),
			step({
				filters: [{
					property_name: 'page.location.hash',
					operator: 'contains',
					property_value: 'myft'
				},
				{
					property_name: 'page.location.type',
					operator: 'eq',
					property_value: 'article'
				}]
			})
		]
	};

}

function getFunnelDataForTimeframe(start, end) {
	start = daysFromNow(start);
	end = daysFromNow(end);
	var dashboard = getDashboard(start, end);
	var query = new Keen.Query("funnel", {
		steps: dashboard.steps,
		maxAge: 10800
	});
	return query;
}


function getFunnelGraph(el) {
	return new Keen.Dataviz()
		.el(el)
		.title(null)
		.chartType('barchart')
		.colors([ Keen.Dataviz.defaults.colors[4], Keen.Dataviz.defaults.colors[3] ])
		.chartOptions({
				chartArea: { left: "30%", height: '400px'},
				legend: { position: "none" }
		})
		.prepare();
}

function viewsOverTime(client) {
	var interval = "weekly";
	var timeframe = "last_30_days";

	var articleViews = new Keen.Query('count', { // first query
		eventCollection: "dwell",
		interval: interval,
		timeframe: timeframe,
		filters: [{
			property_name: 'user.uuid',
			operator: 'exists',
			property_value: true
		},
		{
			property_name: 'page.location.type',
			operator: 'eq',
			property_value: 'article'
		}]
	});

	var myftArticleViews = new Keen.Query('count', { // second query
		eventCollection: "dwell",
		interval: interval,
		timeframe: timeframe,
		filters: [
		{
			property_name: 'user.uuid',
			operator: 'exists',
			property_value: true
		},
		{
			property_name: 'page.location.hash',
			operator: 'contains',
			property_value: 'myft'
		},
		{
			property_name: 'page.location.type',
			operator: 'eq',
			property_value: 'article'
		}]
	});

	var chart = new Keen.Dataviz()
		.el(document.getElementById("myft-views"))
		.chartType("barchart")
		.chartOptions({
			isStacked: 'percent',
			height: 500
		})
		.prepare();

	client.run([articleViews, myftArticleViews], function(err, res) { // run the queries

		var result1 = res[0].result;
		var result2 = res[1].result;
		var data = [];
		var i=0;

		while (i < result1.length) {
				data[i]={ // format the data so it can be charted
						timeframe: result1[i]["timeframe"],
						value: [
								{ category: "Article Views", result: result1[i]["value"] },
								{ category: "myFT article views", result: result2[i]["value"] }
						]
				};

				if (i === result1.length-1) { // chart the data
					chart
						.parseRawData({ result: data })
						.render();
					}
				i++;
		}

	});
}


function usageOverTime(client) {
	var interval = "daily";
	var timeframe = "last_30_days";

	var nextUsers = new Keen.Query('count_unique', {
		eventCollection: "dwell",
		interval: interval,
		targetProperty: 'user.uuid',
		timeframe: timeframe,
		filters: [{
			property_name: 'user.uuid',
			operator: 'exists',
			property_value: true
		}]
	});

	var followUsers = new Keen.Query('count_unique', {
		eventCollection: "dwell",
		interval: interval,
		timeframe: timeframe,
		targetProperty: 'user.uuid',
		filters: [
		{
			property_name: 'user.uuid',
			operator: 'exists',
			property_value: true
		},
		{
			property_name: 'userPrefs.following',
			operator: 'gte',
			property_value: 1
		}]
	});

	var myFTUsers = new Keen.Query('count_unique', {
		eventCollection: "dwell",
		interval: interval,
		timeframe: timeframe,
		targetProperty: 'user.uuid',
		filters: [
		{
			property_name: 'user.uuid',
			operator: 'exists',
			property_value: true
		},
		{
			property_name: 'page.location.hash',
			operator: 'contains',
			property_value: 'myft'
		}]
	});


	var myFTChart = new Keen.Dataviz()
		.el(document.getElementById("myft-usage"))
		.chartType("linechart")
		.chartOptions({
			height: 500
		})
		.prepare();

	client.run([nextUsers, followUsers, myFTUsers], function(err, res) { // run the queries

		var next = res[0].result;
		var follow = res[1].result;
		var myft = res[2].result;
		var myFTUsageData = [];
		var i=0;

		while (i < follow.length) {
			myFTUsageData[i]={ // format the data so it can be charted
					timeframe: follow[i]["timeframe"],
					value: [
							{ category: "Next Users", result: next[i]["value"] },
							{ category: "Follow users", result: follow[i]["value"] },
							{ category: "myFT users", result: myft[i]["value"] }
					]
			};
			if (i === follow.length-1) { // chart the data
				myFTChart
					.parseRawData({ result: myFTUsageData })
					.render();
				}
			i++;
		}

	});
}


function init(client) {
	var flowForTimeframes = function(current, comparison) {
		var section = document.querySelector(`.section--${current.name}`);
		var promises = [];
		promises.push(client.run(getFunnelDataForTimeframe(current.start, current.end)));
		promises.push(client.run(getFunnelDataForTimeframe(comparison.start, comparison.end)));


		var funnelGraph = getFunnelGraph(section.querySelector('.funnel'));
		Promise.all(promises).then(function([currentResults, previousResults]) {
			var combined = currentResults.result.map(function(val, index) {
				return [labels[index], val, previousResults.result[index]];
			});

			funnelGraph
				.parseRawData({ result: combined })
				.labels(labels)
				.render();

			var usage = currentResults.result[1] / currentResults.result[0];

			section.querySelector('.numbers-table--usage .numbers-table__current').textContent = (Math.round(usage * 10000 ) / 100) + '%';

			var prevUsage = previousResults.result[1] / previousResults.result[0];

			section.querySelector('.numbers-table--usage .numbers-table__previous').textContent = (Math.round(prevUsage * 10000 ) / 100) + '%';

			var usageDiff = ((usage - prevUsage) / prevUsage);

			section.querySelector('.numbers-table--usage .numbers-table__change').textContent = (Math.round(usageDiff * 10000 ) / 100) + '%';

		});
	};

	flowForTimeframes(
	{
		name: 'today',
		start: -1 + offset,
		end: 0  + offset
	}, {
		name: 'yesterday',
		start: -2  + offset,
		end: -1  + offset
	});

	flowForTimeframes(
	{
		name: 'this-week',
		start: -7  + offset,
		end: 0  + offset
	}, {
		name: 'last-week',
		start: -14  + offset,
		end: -7  + offset
	});

	document.getElementById('offset-date').textContent = daysFromNow(offset);

	viewsOverTime(client);
	usageOverTime(client);

}

module.exports = {
	init: init
};
