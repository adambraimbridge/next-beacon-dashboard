"use strict";

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

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
}

Keen.ready(function(){

	switch (location.pathname) {
		
		case '/graph/ab/aa':

			render(require('./queries/ab/aa'))
			break;
		
		case '/graph/ab/homepage-promo':

			render(require('./queries/ab/homepage-promo'))
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

			render(require('./queries/uniques/by-geo').continent, {
				chartType: "areachart",
				titlePosition: 'none',
				isStacked: 'percent',
				colors: ['rgb(115, 192, 58)', 'rgb(150, 85, 126)', 'rgb(101, 185, 172)', 'rgb(70, 130, 180)', 'rgb(203, 81, 58)', 'rgb(120, 95, 67)'], 
				lineWidth: 0,
				theme: 'maximized',
				areaOpacity: 0.8
			});
			
			render(require('./queries/uniques/by-geo').country, {
				chartType: "table"
			});

			break;
		
		case '/graph/uniques/by-device':

			render(require('./queries/uniques/by-device'), {
				chartType: "columnchart",
				height: '400'
			});

			break;


		case '/graph/uniques/timeline':
			
			render(require('./queries/uniques/trend'), {
				chartType: "areachart",
				titlePosition: 'none',
				height: 400,
				colors: ['rgb(115, 192, 58)'], 
				lineWidth: 0,
				theme: 'maximized',
				areaOpacity: 0.8,
				labels: ['unique users']
			});

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
			render(require('./queries/active-usage'), {
				title: 'Active usage'
			});
			break;

		case '/graph/flow':
			render(require('./queries/flow'), {});
			break;

		default:
			console.log('unknown graph');
	}

});
