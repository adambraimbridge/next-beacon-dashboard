/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var bounceRateChart = new Keen.Dataviz()
	.chartOptions({
		suffix: '%'
	})
	.title("Percentage of anonymous users viewing only one page")
	.el(document.getElementById("bounceRate"))
	.chartType("metric")
	.prepare();

var scrollDepthChart =new Keen.Dataviz()
	.chartOptions({
		legend: {position:'none'},
		vAxis:{
			baselineColor: '#fff',
			textPosition: 'none'
		}
	})
	.title("Amount of the article body scrolled by anon users")
	.el(document.getElementById("scrollDepth"))
	.chartType("columnchart")
	.prepare();


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

var bounceRateQuery =  new Keen.Query("count", {
	eventCollection: "dwell",
	filters: [
		{"operator":"exists","property_name":"user.uuid","property_value":false},
		{"operator":"exists","property_name":"meta.sessionServiceDown","property_value":false}
	],
	groupBy: "user.device_id",
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var scrollDepthQuery = new Keen.Query("count", {
	eventCollection: "scrolldepth",
	filters: [{"operator":"exists","property_name":"user.uuid","property_value":false},{"operator":"exists","property_name":"meta.sessionServiceDown","property_value":false}],
	groupBy: "meta.percentageViewed",
	targetProperty: "meta.percentageViewed",
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
				`<tr>
					<td><a target="_blank" href="${url}" style="padding-right:3em">${url}</a></td>
				 	<td>${item.result}</td>
				 	<td>${percentage}</td>
				</tr>`);
	});
	document.querySelector('.loading-pageviews').style['display'] = 'none';
});

client.run(bounceRateQuery, function(err, response){
	if(err){
		console.error(err);
		return;
	}

	var total = response.result.length;
	var bouncers = response.result.filter(item => item.result === 1).length;
	var bounceRate = Math.round((bouncers/total)*100);
	bounceRateChart.parseRawData({result:bounceRate}).render();
});

client.run(scrollDepthQuery, function(err, response){
	if(err){
		console.error(err);
		return;
	}

	scrollDepthChart.parseRawData({result:response.result}).render();
});
