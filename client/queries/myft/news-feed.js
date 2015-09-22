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
	'Are following at least one topic',
	'Visited their "myFT" page ...',
	'... then went straight to an article'
];

var filterMyNewsPage = [{
		property_name: 'page.location.pathname',
		operator: 'contains',
		property_value: 'myft/'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/portfolio'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/my-topics'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/product-tour'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/api'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/preferences'
	},
	{
		property_name: 'page.location.pathname',
		operator: 'not_contains',
		property_value: 'myft/saved-articles'
	}
];


function headlineClicksPerUser(client) {
	var interval = "daily";
	var timeframe = "last_30_days";

	var myNewsUsers = new Keen.Query('count_unique', { // first query
		eventCollection: "dwell",
		targetProperty: 'user.uuid',
		interval: interval,
		timeframe: timeframe,
		filters: filterMyNewsPage
	});

	var headlineClicks = new Keen.Query('count', { // second query
		eventCollection: "cta",
		interval: interval,
		timeframe: timeframe,
		filters: [
		{
			property_name: 'meta.domPath',
			operator: 'contains',
			property_value: 'mypage'
		},
		{
			property_name: 'meta.domPath',
			operator: 'contains',
			property_value: 'headline'
		}]
	});

	var chart = new Keen.Dataviz()
		.el(document.getElementById("headline-clicks-per-user"))
		.chartType("columnchart")
		.chartOptions({
			height: 500,
			trendlines: {
				0: {
					color: 'green',
					type: 'polynomial',
					degree: 6
				}
			}
		})
		.prepare();

	client.run([myNewsUsers, headlineClicks], function(err, res) { // run the queries
		var result1 = res[0].result;
		var result2 = res[1].result;
		var data = [];
		var i=0;

		while (i < result1.length) {
				data[i]={ // format the data so it can be charted
						timeframe: result1[i]["timeframe"],
						value: [
								{ category: "Headline Clicks per User", result: result2[i]["value"] / result1[i]["value"] },
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
		'title' : 'Engagement with myFT news feed',
		'labels' : labels,
		'steps':[
			step({
				filters: [{
					property_name: 'userPrefs.following',
					operator: 'gte',
					property_value: 1
				}]
			}),
			step({
			filters: filterMyNewsPage
		}),
		step({
			filters: [{
				property_name: 'page.location.hash',
				operator: 'contains',
				property_value: 'myft:my-news:page'
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

			var ctr = currentResults.result[2] / currentResults.result[1];
			var openRate = currentResults.result[1] / currentResults.result[0];

			section.querySelector('.numbers-table--click-rate .numbers-table__current').textContent = (Math.round(ctr * 10000 ) / 100) + '%';
			section.querySelector('.numbers-table--open-rate .numbers-table__current').textContent = (Math.round(openRate * 10000 ) / 100) + '%';

			var prevCtr = previousResults.result[2] / previousResults.result[1];
			var prevOpenRate = previousResults.result[1] / previousResults.result[0];

			section.querySelector('.numbers-table--click-rate .numbers-table__previous').textContent = (Math.round(prevCtr * 10000 ) / 100) + '%';
			section.querySelector('.numbers-table--open-rate .numbers-table__previous').textContent = (Math.round(prevOpenRate * 10000 ) / 100) + '%';

			var ctrDiff = ((ctr - prevCtr) / prevCtr);
			var openDiff = ((openRate - prevOpenRate) / prevOpenRate);

			section.querySelector('.numbers-table--click-rate .numbers-table__change').textContent = (Math.round(ctrDiff * 10000 ) / 100) + '%';
			section.querySelector('.numbers-table--open-rate .numbers-table__change').textContent = (Math.round(openDiff * 10000 ) / 100) + '%';

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

	headlineClicksPerUser(client);

}

module.exports = {
	init: init
};
