/* global Keen */

'use strict';

var KeenQuery = require('n-keen-query');
var union = require('lodash/array/union');

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var offset = parseInt(queryParameters.offset) || 0;

function daysFromNow (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject;
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


function usageForPeriod(startDate, endDate, name) {

	const section = document.querySelector(`.section--${name}`);
	const funnelGraph = getFunnelGraph(section.querySelector('.funnel'));

	const nextUserCountQuery = new KeenQuery('dwell')
		.count('user.uuid')
		.absTime(startDate, endDate)
		.compare()
		.print('json');

	const myFtPageVisitorsQuery = new KeenQuery('dwell')
		.select('user.uuid')
		.filter('page.location.hash>>myft')
		.absTime(startDate, endDate)
		.compare()
		.print('json');

	const myFtDailyEmailOpenersQuery = new KeenQuery('email')
		.select('user.uuid')
		.filter('event=open')
		.filter('meta.emailType=daily')
		.absTime(startDate, endDate)
		.compare()
		.print('json');

	Promise.all([nextUserCountQuery, myFtPageVisitorsQuery, myFtDailyEmailOpenersQuery])
		.then(results => {
			const nextUserCount = results[0];
			const myFtPageVisitors = results[1];
			const myFtDailyEmailOpeners = results[2];

			const myFtUserCount = {
				curr: union(myFtPageVisitors.curr.result, myFtDailyEmailOpeners.curr.result).length,
				prev: union(myFtPageVisitors.prev.result, myFtDailyEmailOpeners.prev.result).length
			};

			const combined = [
				['Visited Next', nextUserCount.curr, nextUserCount.prev],
				['Is a myFT user', myFtUserCount.curr, myFtUserCount.prev]
			];

			funnelGraph
				.parseRawData({result: combined})
				.render();

			var usage = myFtUserCount.curr / nextUserCount.curr.result;
			section.querySelector('.numbers-table--usage .numbers-table__current').textContent = (Math.round(usage * 10000 ) / 100) + '%';

			var prevUsage = myFtUserCount.prev / nextUserCount.prev.result;
			section.querySelector('.numbers-table--usage .numbers-table__previous').textContent = (Math.round(prevUsage * 10000 ) / 100) + '%';

			var usageDiff = ((usage - prevUsage) / prevUsage);
			section.querySelector('.numbers-table--usage .numbers-table__change').textContent = (Math.round(usageDiff * 10000 ) / 100) + '%';

		});
}


function usageOverTime(client) {
	var interval = "daily";
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

	var myFtArticleViews = new Keen.Query('count', { // second query
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


	var usersOnMyFtPagesSelect = new Keen.Query('select_unique', {
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

	var usersOpeningDailyEmailSelect = new Keen.Query('select_unique', {
		eventCollection: 'email',
		timeframe: timeframe,
		interval: interval,
		target_property: 'user.uuid',
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
	});


	var myFtChart = new Keen.Dataviz()
		.el(document.getElementById("myft-usage"))
		.chartType("linechart")
		.chartOptions({
			height: 500
		})
		.prepare();

	var viewsChart = new Keen.Dataviz()
		.el(document.getElementById("myft-views"))
		.chartType("barchart")
		.chartOptions({
			isStacked: 'percent',
			height: 500
		})
		.prepare();

	var consumptionChart = new Keen.Dataviz()
		.el(document.getElementById("myft-consumption"))
		.chartType("columnchart")
		.chartOptions({
			height: 500,
			trendlines: {
				0: {
					color: 'green'
				}
			}
		})

		.prepare();


	client.run([nextUsers, followUsers, articleViews, myFtArticleViews, usersOnMyFtPagesSelect, usersOpeningDailyEmailSelect], function(err, res) { // run the queries

		var next = res[0].result;
		var follow = res[1].result;
		var articles = res[2].result;
		var myFtArticles = res[3].result;
		var onMyFtPagesSelect = res[4].result;
		var openingMyFtEmailsSelect = res[5].result;

		var myFtUsageData = [];
		var articleViewData = [];
		var articleConsumptionData = [];

		var i=0;

		while (i < follow.length) {

			const myFtUsers = union(onMyFtPagesSelect[i].value, openingMyFtEmailsSelect[i].value).length;

			myFtUsageData[i]={ // format the data so it can be charted
					timeframe: follow[i]["timeframe"],
					value: [
							{ category: "Next Users", result: next[i]["value"] },
							{ category: "Follow users", result: follow[i]["value"] },
							{ category: "myFT users", result: myFtUsers }
					]
			};
			articleViewData[i]={ // format the data so it can be charted
						timeframe: follow[i]["timeframe"],
						value: [
								{ category: "Article Views", result: articles[i]["value"] },
								{ category: "myFT article views", result: myFtArticles[i]["value"] }
						]
				};
			articleConsumptionData[i]={ // format the data so it can be charted
					timeframe: follow[i]["timeframe"],
					value: [
							{ category: "myFT Articles consumed per user", result: myFtArticles[i]["value"] / myFtUsers }
					]
			};

			if (i === follow.length-1) { // chart the data
				myFtChart
					.parseRawData({ result: myFtUsageData })
					.render();

				viewsChart
					.parseRawData({ result: articleViewData })
					.render();

				consumptionChart
					.parseRawData({ result: articleConsumptionData })
					.render();

			}
			i++;
		}

	});
}


function init(client) {

	usageForPeriod(daysFromNow(-7), new Date(), 'this-week');
	usageForPeriod(daysFromNow(-1), new Date(), 'today');

	usageOverTime(client);

	document.getElementById('offset-date').textContent = daysFromNow(offset).toISOString();
}

module.exports = {
	init: init
};
