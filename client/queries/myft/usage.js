/* global Keen */

'use strict';

var KeenQuery = require('n-keen-query');
var union = require('lodash/array/union');

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var offset = parseInt(queryParameters.offset) || 0;

function dateThisManyDaysFromNow (days) {
	days = days || 0;
	var dateObject = new Date();
	dateObject.setDate((dateObject.getDate() + days) + offset);
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

	const nextUserCountQuery = `@comparePast(dwell->count(user.uuid)->absTime(${startDate.toISOString()},${endDate.toISOString()})->print(json))`;
	const nextUserCountPromise = KeenQuery.execute(nextUserCountQuery);

	const myFtPageVisitorsQuery = `@comparePast(dwell->select(user.uuid)->filter(page.location.hash>>myft)->absTime(${startDate.toISOString()},${endDate.toISOString()})->print(json))`;
	const myFtPageVisitorsPromise = KeenQuery.execute(myFtPageVisitorsQuery);

	const myFtDailyEmailOpenersQuery = `@comparePast(email->select(user.uuid)->filter(event=open)->filter(meta.emailType=daily)->absTime(${startDate.toISOString()},${endDate.toISOString()})->print(json))`;
	const myFtDailyEmailOpenersPromise = KeenQuery.execute(myFtDailyEmailOpenersQuery);

	Promise.all([nextUserCountPromise, myFtPageVisitorsPromise, myFtDailyEmailOpenersPromise])
		.then(results => {

			const nextUserCount = {
				curr: results[0].queries[0].data.result,
				prev: results[0].queries[1].data.result
			};

			const myFtPageVisitors = {
				curr: results[1].queries[0].data.result,
				prev: results[1].queries[1].data.result
			};

			const myFtDailyEmailOpeners = {
				curr: results[2].queries[0].data.result,
				prev: results[2].queries[1].data.result
			};

			const myFtUserCount = {
				curr: union(myFtPageVisitors.curr, myFtDailyEmailOpeners.curr).length,
				prev: union(myFtPageVisitors.prev, myFtDailyEmailOpeners.prev).length
			};

			const combined = [
				['Visited Next', nextUserCount.curr, nextUserCount.prev],
				['Is a myFT user', myFtUserCount.curr, myFtUserCount.prev]
			];

			funnelGraph
				.parseRawData({result: combined})
				.render();

			var usage = myFtUserCount.curr / nextUserCount.curr;
			section.querySelector('.numbers-table--usage .numbers-table__current').textContent = (Math.round(usage * 10000 ) / 100) + '%';

			var prevUsage = myFtUserCount.prev / nextUserCount.prev;
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

	usageForPeriod(dateThisManyDaysFromNow(-7), dateThisManyDaysFromNow(), 'this-week');
	usageForPeriod(dateThisManyDaysFromNow(-1), dateThisManyDaysFromNow(), 'today');

	usageOverTime(client);

	document.getElementById('offset-date').textContent = dateThisManyDaysFromNow().toISOString();
}

module.exports = {
	init: init
};
