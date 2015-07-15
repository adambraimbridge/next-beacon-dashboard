/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var pagesVisited = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	filters: [
		{"operator":"exists","property_name":"user.uuid","property_value":false},
		{"operator":"exists","property_name":"meta.sessionServiceDown","property_value":false}
	],
	groupBy: "page.location.pathname",
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

client.run(pagesVisited, function(err, response){
	var ul = document.getElementById('pageViews');
	var total = response.result.reduce((previous, current) => previous + current.result, 0);
	response.result
		.sort((a, b) => b.result - a.result)
		.slice(0,20)
		.forEach((item) => {
			var url = 'https://' + ('next.ft.com/' + item['page.location.pathname']).replace(/\/{2}/g, '/');
			var percentage = Math.round( (item.result / total) * 100) + '%';
			ul.insertAdjacentHTML(
				'beforeend',
				`<li>
					<a target="_blank" href="${url}" style="padding-right:3em">${url}</a>
					<span>${item.result} (${percentage})</span>
				</li>`);
	});
	document.querySelector('.loading-pageviews').style['display'] = 'none';

});
