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
	'Visited next ...',
	'...then went to the saved-articles page',
	'... then went straight to an article'
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
		'title' : 'Engagement with myFT saved articles',
		'labels' : labels,
		'steps':[
			step({}),
			step({
			filters: [{
				property_name: 'page.location.pathname',
				operator: 'contains',
				property_value: 'myft/saved-articles'
			}]
		}),
		step({
			filters: [{
				property_name: 'page.location.hash',
				operator: 'contains',
				property_value: 'myft:saved-articles:page'
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
	var initialiseForTimeframes = function(current, comparison) {
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



	initialiseForTimeframes(
	{
		name: 'today',
		start: -1 + offset,
		end: 0  + offset
	}, {
		name: 'yesterday',
		start: -2  + offset,
		end: -1  + offset
	});

	initialiseForTimeframes(
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

}

module.exports = {
	init: init
};
