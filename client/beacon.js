"use strict";

var _ = require('lodash');

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
		
		client.run(keen.query, function (err, results) {
			keen.render(el, results, opts);
		});

	} else {
		client.draw(keen.query, el, opts);
	}
}

Keen.ready(function(){

	switch (location.pathname) {
		
		case '/graph/addiction':

			render(require('./queries/addiction').thisWeek, { title: 'This week' });
			render(require('./queries/addiction').lastWeek, { title: 'Last week' });
			render(require('./queries/addiction').thisTimeLastMonth, { title: 'This time last month' });
			break;
		
		case '/graph/addiction/weekly':

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
	
		default:
			console.log('unknown graph');
	}

});
