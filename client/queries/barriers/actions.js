/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var barrierCTAClicks = new Keen.Query("funnel", {
	steps : [
		{
			eventCollection: "barrier",
			groupBy: "meta.type",
			actorProperty: "user.device_id"
		},
		{
			eventCollection: "cta",
			filters: [{"operator":"contains","property_name":"meta.domPath","property_value":"subscribe-"}],
			targetProperty: "meta.domPath",
			actorProperty: "user.device_id"
		},
		{
			eventCollection: "cta",
			filters: [{"operator":"contains","property_name":"meta.domPath","property_value":"sign-in"}],
			targetProperty: "meta.domPath",
			actorProperty: "user.device_id"
		}
	],
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var barrierCTAClicksChart = new Keen.Dataviz()
	.el(document.getElementById('barrierCTAClicks'))
	.chartType('piechart')
	.height(450)
	.prepare();

client.run(barrierCTAClicks, function(err, response){
	console.log('error', err);
	console.log('result', response);
	barrierCTAClicksChart.parseRawData(
		{
			result : [
				{
					name: 'Clicks subscribe link',
					value : response.result[1]
				},
				{
					name: 'Clicks sign-up link',
					value : response.result[2]
				},
				{
					name: 'Clicks outside of the barrier',
					value: response.result[0] - (response.result[1] + response.result[2])
				}
			]
		}
	).render();
});
