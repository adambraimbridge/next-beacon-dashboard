/* global Keen, $ */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// Return the ISO string for relative dates
var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};



function getDashboards(offset) {
	offset = offset || 0;
	var dashboards = {};

	// This is a base step object, for spawning steps.
	var step = function(options) {
		return {
			eventCollection:options.eventCollection || "dwell",
			actor_property:"user.uuid",
			timeframe:options.timeframe || {
				start:daysFromNow(offset-14), //two weeks whence
				end:daysFromNow(offset) //now
			},
			filters:options.filters || [],
		};
	};

	dashboards['Galleries'] = {
		'title' : 'Engagement with galleries',
		'labels' : [
		'Visited next.ft.com',
		'Visited a page with a gallery',
		'Viewed at least 25%',
		'Viewed at least 50%',
		'Viewed at least 75%',
		'Viewed all the gallery'
		],
		'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'page.capi.hasGallery',
				operator: 'eq',
				property_value: true
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 25
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 50
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 75
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 100
			}]
		})
		]
	};

	dashboards['TOC'] = {
		'title' : 'Engagement with Table of Contents',
		'labels' : [
		'Visited a page with a TOC',
		'Clicked on a chapter link'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'page.capi.hasTOC',
				operator: 'eq',
				property_value: true
			}]
		}),
		step({
			eventCollection: 'cta',
			filters: [{
				property_name: 'meta.domPath',
				operator: 'contains',
				property_value: '| toc'
			}]
		})
		]
	};


	dashboards['AllMyFTNotifications'] = {
		'title' : 'Engagement with any myFT notification',
		'labels' : [
		'Visited next.ft.com',
		'Are following at least one topic',
		'Viewed an article via myft:notification'
		],
		'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
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


	dashboards['MyFT'] = {
		'title' : 'Engagement with myFT page',
		'labels' : [
		'Are following at least one topic',
		'Visited their "myFT" page ...',
		'... then went straight to an article'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				property_name: 'page.location.pathname',
				operator: 'contains',
				property_value: 'myft/my-news'
			}]
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

	dashboards['MyFTRSS'] = {
		'title' : 'Engagement with myFT RSS feeds',
		'labels' : [
		'Are following at least one topic',
		'Have published their RSS feed',
		'Have come to an article as a result of a myFT RSS feed (NB: This is currently unreliable)'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				eventCollection: 'dwell',
				property_name: 'user.myft.preferences.publish-rss-feeds',
				operator: 'eq',
				property_value: true
			}]
		}),
		step({
			filters: [{
				property_name: 'page.location.hash',
				operator: 'contains',
				property_value: 'myft'
			},{
				property_name: 'page.location.hash',
				operator: 'contains',
				property_value: 'rss'
			}]
		})
		]
	};


	dashboards['MyFTDailyEmail'] = {
		'title' : 'Engagement with myFT daily emails',
		'labels' : [
		'Are following at least one topic',
		'Have recieved daily emails',
		'Have opened a daily email',
		'Have clicked on a link in a daily email'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
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
		}),
		]
	};

	dashboards['MyFTWeeklyEmail'] = {
		'title' : 'Engagement with myFT weekly digest emails',
		'labels' : [
		'Are following at least one topic',
		'Have recieved a weekly email',
		'Have opened a weekly email',
		'Have clicked on a link in a weekly email'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
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
				property_value: 'weekly'
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
				property_value: 'weekly'
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
				property_value: 'weekly'
			},{
				property_name: 'event',
				operator: 'eq',
				property_value: 'click'
			}]
		}),
		]
	};


	dashboards['MyFTTray'] = {
		'title' : 'Engagement with myFT Tray',
		'labels' : [
		'Are following at least one topic',
		'Seen the tray',
		'Clicked on the tray',
		'Clicked on an article from the tray'
		],
		'steps':[
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			},
			{
				property_name: 'page.location.type',
				operator: 'in',
				property_value: ['article', 'stream', 'search']
			}]
		}),
		step({
			eventCollection: 'cta',
			filters: [{
				property_name: 'meta.domPath',
				operator: 'contains',
				property_value: 'myft-tray | cta'
			}]
		}),
		step({
			eventCollection: 'cta',
			filters: [{
				property_name: 'meta.domPath',
				operator: 'contains',
				property_value: 'myft-tray | myft-feed | article-card | headline'
			}]
		})
		]
	};
	return dashboards;
}




function getFunnelForOffset(offset) {

	var dashboards = getDashboards(offset);
	var query = new Keen.Query("funnel", {
		steps:dashboards[queryParameters.dashboard].steps,
		maxAge: 10800
	});

	console.log('dashboard ', dashboards[queryParameters.dashboard]);

	return query;
}

var initialOffset = parseInt(queryParameters.offset) || 0;
var queries = [getFunnelForOffset(initialOffset), getFunnelForOffset(initialOffset-7), getFunnelForOffset(initialOffset-14), getFunnelForOffset(initialOffset-21)];

	var dashboards = getDashboards(0);
	var currentDashboard = dashboards[queryParameters.dashboard];

	$('h1').text(currentDashboard.title);

	var funnel = new Keen.Dataviz()
			.el(document.getElementById("funnel"))
			.title("Count of unique users for 14 days (" + daysFromNow(initialOffset - 14) + " to " +  daysFromNow(initialOffset) + ")" )
			.colors([ Keen.Dataviz.defaults.colors[4] ])
			.chartOptions({
					chartArea: { left: "30%" },
					legend: { position: "none" }
			})
			.prepare();

	var historicChart = new Keen.Dataviz()
		.chartType("columnchart")
		.el(document.getElementById('historic'))
		.title("% " + currentDashboard.labels[currentDashboard.labels.length -1] + ' - over the last month')
		.chartOptions({
				legend: { position: "none" },
				vAxis: { format: '#,###.#%' },
				hAxis: { format:'MMM d'}
		})
		.prepare();

var render = function (el, results, opts, client) {
	var historicData = [];
	if(results) {

		funnel
				.parseRawData(results[0])
				.labels(currentDashboard.labels)
				.render();



		results.forEach(function(response, index) {
			var percentage = response.result[response.result.length - 1]/response.result[0];
			historicData.push({
				"value" : percentage,
				"timeframe" : {
					"start" : response.steps[0].timeframe["start"],
					"end" : response.steps[0].timeframe["end"]
				}
			});
		});

historicChart
	.parseRawData({ result: historicData })
	.render();
	}

};

module.exports = {
	query: queries,
	render: render
};
