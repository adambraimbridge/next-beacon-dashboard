/* global Keen */

"use strict";

var client = require('./lib/wrapped-keen');

var container = document.getElementById("graph__container");

// Given a query object { query: new Keen.Query(...), render: fn }
var render = function (keen, opts) {
	var el = document.createElement('div');
	container.appendChild(el);

	if (keen.render) {

		console.log('running query!');
		client.run(keen.query, function (err, results) {
			console.log('query done, calling render');
			keen.render(el, results, opts, client);
		});

	} else {
		client.draw(keen.query, el, opts);
	}
};


Keen.ready(function(){
	var on;
	var off;

	switch (location.pathname) {

		case '/graph/ab/aa':

			render(require('./queries/ab/aa'));
			break;

		case '/graph/ab/engaged-follow':

			// FIXME - move to Promise.all
			on = require('./queries/ab/engaged-follow').on;
			off = require('./queries/ab/engaged-follow').off;

			client.run(off, function (err, results) {
				console.log('query done');
				var a = results;
				client.run(on, function (err, results) {
					var b = results;
					var el = document.createElement('div');
					container.appendChild(el);
					require('./queries/ab/engaged-follow').render(a, b, el);
				});
			});

			break;

		case '/graph/ab/homepage-promo':

			// FIXME - move to Promise.all
			on = require('./queries/ab/homepage-promo').on;
			off = require('./queries/ab/homepage-promo').off;

			client.run(off, function (err, results) {
				console.log('query done');
				var a = results;
				client.run(on, function (err, results) {
					var b = results;
					var el = document.createElement('div');
					container.appendChild(el);
					require('./queries/ab/homepage-promo').render(a, b, el);
				});
			});

			break;

		case '/graph/opt-in':

			render(require('./queries/opt-in').innie, {
				title: 'Opt-ins over last 24 hours',
				colors: ['#6FF187']
			});

			render(require('./queries/opt-in').outie, {
				title: 'Opt-outs over last 24 hours',
				colors: ['#FF6060']
			});

			render(require('./queries/opt-in').lastWeek, {
				title: 'Opt-in Vs out over the last week',
				chartType: 'columnchart',
				colors: ['#6FF187', '#FF6060']
			});

			render(require('./queries/opt-in').reasons, {
				chartType: "areachart",
				isStacked: 'percent',
				colors: ['rgb(115, 192, 58)', 'rgb(150, 85, 126)', 'rgb(101, 185, 172)', 'rgb(70, 130, 180)', 'rgb(203, 81, 58)', 'rgb(120, 95, 67)'],
				lineWidth: 0,
				areaOpacity: 0.9,
				height: 500,
				theme: 'maximized'
			});

			render(require('./queries/opt-in').difficultNavigation, {
				title: 'Navigation feedback detail',
				chartType: "columnchart"
			});

			break;

		case '/graph/addiction':

			render(require('./queries/addiction').thisWeek, { title: 'This week' });
			render(require('./queries/addiction').lastWeek, { title: 'Last week' });
			render(require('./queries/addiction').thisTimeLastMonth, { title: 'This time last month' });
			break;

		case '/graph/addiction-weekly':

			render(require('./queries/addiction').weekly, { title: 'Weekly addiction' });
			render(require('./queries/addiction').weeklyThisTimeLastMonth, { title: 'Weekly - this time last month' });

			break;

		case '/graph/uniques/by-page':

			render(require('./queries/uniques/by-page'), {
				chartType: "areachart",
				titlePosition: 'none',
				isStacked: 'percent',
				colors: ['rgb(115, 192, 58)', 'rgb(150, 85, 126)', 'rgb(101, 185, 172)', 'rgb(70, 130, 180)', 'rgb(203, 81, 58)', 'rgb(120, 95, 67)'],
				lineWidth: 0,
				theme: 'maximized',
				areaOpacity: 0.8
			});

			break;

		case '/graph/uniques/by-geo':
			render(require('./queries/uniques/by-geo'));
			break;

		case '/graph/uniques/by-device':

			render(require('./queries/uniques/by-device'), {
				chartType: "columnchart",
				height: '400'
			});

			break;

		case '/graph/uniques/timeline':
			require('./queries/uniques/trend');
			break;

		case '/graph/uniques':

			render(require('./queries/uniques/today'), {
				title: 'Unique users so far today'}
			);

			render(require('./queries/uniques/yesterday'), {
				title: 'Unique users yesterday',
				colors: ['#77C9BC']
			});

			render(require('./queries/uniques/two_week_average'));

			break;

		case '/graph/active-usage':
			render(require('./queries/active-usage'));
			break;

		case '/graph/flow':
			render(require('./queries/flow'));
			break;

		case '/graph/searchterms':
			render(require('./queries/searchterms'));
			break;

		case '/graph/navigation':
			render(require('./queries/navigation'));
			break;

		case '/graph/frequency-recency':
			require('./queries/frequency-recency').init(client);
			break;

		case '/graph/myft':
			require('./queries/myft').init(client);
			break;
		case '/graph/dead-letter-office':
			require('./queries/dead-letter-office');
			break;

		default:
			console.log('unknown graph');

	}

});
