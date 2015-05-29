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
		client.run(keen.query, function (err, results) {
			keen.render(el, results);
		});
	} else {
		client.draw(keen.query, el, opts);
	}
}

Keen.ready(function(){

	switch (location.pathname) {
		
		case '/graph/uniques/timeline':
			
			render(require('./queries/uniques/trend'), {
				chartType: "areachart",
				title: 'Unique users over the last 2 weeks',
				colors: ['#77C9BC'],
				height: 400,
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
			
			render(require('./queries/uniques/two_week_average'), { });

			break;
	
		default:
			console.log('unknown graph');
	}

});
