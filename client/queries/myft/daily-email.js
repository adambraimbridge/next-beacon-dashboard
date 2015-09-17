/* global Keen, $ */

'use strict';

var util = require('./util');

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

var labels = [
	'Are following at least one topic',
	'Have recieved daily emails',
	'Have opened a daily email',
	'Have clicked on a link in a daily email'
];


function getDashboard(start, end) {
	var dashboards = {};

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
		'title' : 'Engagement with myFT daily emails',
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
				eventCollection: 'email',
				filters: [
				{
					property_name: 'meta.emailType',
					operator: 'eq',
					property_value: 'daily'
				}, {
					property_name: 'event',
					operator: 'eq',
					property_value: 'delivery'
				}]
			}),
			step({
				eventCollection: 'email',

				filters: [
				{
					property_name: 'meta.emailType',
					operator: 'eq',
					property_value: 'daily'
				}, {
					property_name: 'event',
					operator: 'eq',
					property_value: 'open'
				}]
			}),
			step({
				eventCollection: 'email',
				filters: [{
					property_name: 'meta.emailType',
					operator: 'eq',
					property_value: 'daily'
				},{
					property_name: 'event',
					operator: 'eq',
					property_value: 'click'
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
};


function getFunnelGraph(el) {
	return new Keen.Dataviz()
		.el(el)
		.title(null)
		.colors([ Keen.Dataviz.defaults.colors[4] ])
		.chartOptions({
				chartArea: { left: "30%" },
				legend: { position: "none" }
		})
		.prepare();
}



function init(client) {
	var initialiseForTimeframe = function(name, start, end) {
		var section = document.querySelector(`.section--${name}`);
		var funnelData = getFunnelDataForTimeframe(start, end);
		var funnelGraph = getFunnelGraph(section.querySelector('.funnel'));
		client.run(funnelData).then(function(results) {
			funnelGraph
				.parseRawData(results)
				.labels(labels)
				.render();

			var ctr = results.result[3] / results.result[2];
			var openRate = results.result[2] / results.result[1];
			var deliverRate = results.result[1] / results.result[0];

			section.querySelector('.numbers--click-rate .numbers__number').textContent = (Math.round(ctr * 10000 ) / 100) + '%';
			section.querySelector('.numbers--open-rate .numbers__number').textContent = (Math.round(openRate * 10000 ) / 100) + '%';
			section.querySelector('.numbers--delivery-rate .numbers__number').textContent = (Math.round(deliverRate * 10000 ) / 100) + '%';
		});
	};
	initialiseForTimeframe('today', -1, 0);
	initialiseForTimeframe('this-week', -7, 0);
	initialiseForTimeframe('last-week', -14, -7);
};

module.exports = {
	init: init
};
