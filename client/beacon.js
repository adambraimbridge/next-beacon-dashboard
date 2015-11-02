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

		case '/graph/ab/performance':
			require('./queries/ab/performance').render();
			break;

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
			require('./queries/opt-in');
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

		case '/graph/uniques/by-browser':
			require('./queries/uniques/by-browser').render();
			break;

		case '/graph/uniques':
			render(require('./queries/uniques/today'), {
				title: 'Unique users so far today'
			});

			render(require('./queries/uniques/yesterday'), {
				title: 'Unique users yesterday'
			});

			render(require('./queries/uniques/two_week_average'));

			render(require('./queries/uniques/fourteen_day_average'));

			require('./queries/uniques/trend');
			break;

		case '/graph/anons/visitors':
			require('./queries/anons/visitors');
			break;

		case '/graph/anons/activity':
			require('./queries/anons/activity');
			break;

		case '/graph/barriers/views':
			require('./queries/barriers/views');
			break;

		case '/graph/barriers/actions':
			require('./queries/barriers/actions');
			break;

		case '/graph/active-usage':
			require('./queries/active-usage');
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

		case '/graph/myft/usage':
			require('./queries/myft/usage').init(client);
			break;

		case '/graph/myft/saved-articles':
			require('./queries/myft/saved-articles').init(client);
			break;

		case '/graph/myft/news-feed':
			require('./queries/myft/news-feed').init(client);
			break;

		case '/graph/myft/daily-email':
			require('./queries/myft/daily-email').init(client);
			break;

		case '/graph/myft/weekly-email':
			require('./queries/myft/weekly-email').init(client);
			break;

		case '/graph/myft/tray':
			require('./queries/myft/tray').init(client);
			break;

		case '/graph/myft':
			require('./queries/myft').init(client);
			break;

		case '/graph/dead-letter-office':
			require('./queries/dead-letter-office');
			break;

		case '/graph/meta-beacon':
			require('./queries/meta-beacon');
			break;

		case '/graph/article/views':
			require('./queries/article/views');
			render(require('./queries/article/last-week-average'));
			require('./queries/article/views-trend');
			break;

		case '/graph/article/views-per-session':
			render(require('./queries/article/views-per-session'));
			break;

		case '/graph/article/actions-by-component':
			require('./queries/article/actions-by-component');
			require('./queries/article/actions-by-component-click-rate');
			break;

		case '/graph/article/actions-by-type':
			require('./queries/article/actions-by-type');
			require('./queries/article/actions-by-type-aggregated');
			break;

		case '/graph/article/scroll-depth-by-screen-size':
			render(require('./queries/article/scroll-depth-by-screen-size'));
			break;

		case '/graph/article/session-referred':
			render(require('./queries/article/sessions-referred'));
			break;

		case '/graph/article/per-session':
			render(require('./queries/article/per-session'));
			break;

		case '/graph/article/ctr':
			require('./queries/article/ctr');
			break;

		case '/graph/stream/views':
			require('./queries/stream/views');
			render(require('./queries/stream/last-week-average'));
			require('./queries/stream/views-trend');
			break;

		case '/graph/stream/by-subscriber-per-day':
			render(require('./queries/stream/by_subscriber_per_day'));
			break;

		case '/graph/stream/most-popular':
			render(require('./queries/stream/most-popular'));
			break;

		case '/graph/stream/actions-by-component':
			require('./queries/stream/actions-by-component');
			break;

		case '/graph/stream/actions-by-type':
			require('./queries/stream/actions-by-type');
			break;

		case '/graph/engagement/articles-read':
			render(require('./queries/engagement/articles-read'));
			break;

		case '/graph/engagement/referrers':
			render(require('./queries/engagement/referrers'));
			break;

		case '/surveycohorts':
			require('./pages/surveycohorts');
			break;

		case '/graph/front-page/ctr':
			require('./queries/front-page/ctr').render();
			break;

		case '/graph/front-page/components':
			require('./queries/front-page/ctr-breakdown').render();
			break;

		case '/graph/front-page/visits':
			require('./queries/front-page/visits').render();
			break;

		case '/graph/front-page/scroll-depth':
			require('./queries/front-page/scroll-depth').render();
			break;

		case '/graph/front-page/performance':
			require('./queries/front-page/performance').render();
			break;

		default:
			console.log('unknown graph');

	}

});
