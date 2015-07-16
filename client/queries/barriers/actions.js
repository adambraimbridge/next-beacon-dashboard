/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});




function barrierSteppedQuery(step){
	return new Keen.Query("funnel", {
		steps : [
			{
				eventCollection: "barrier",
				filters: [{"operator":"eq","property_name":"meta.type","property_value":"shown"}],
				groupBy: "meta.type",
				actorProperty: "user.device_id"
			},
			step
		],
		timeframe: queryParameters.timeframe || "this_14_days",
		timezone: "UTC"
	});
}

var barrierSubscribeClicks = barrierSteppedQuery({
	eventCollection: "cta",
	filters: [{"operator":"contains","property_name":"meta.domPath","property_value":"subscribe-"}],
	targetProperty: "meta.domPath",
	actorProperty: "user.device_id"
});

var barrierSignInClicks = barrierSteppedQuery({
	eventCollection: "cta",
	filters: [{"operator":"contains","property_name":"meta.domPath","property_value":"sign-in"}],
	targetProperty: "meta.domPath",
	actorProperty: "user.device_id"
});

var barrierCTAClicksChart = new Keen.Dataviz()
	.el(document.getElementById('barrierCTAClicks'))
	.chartType('piechart')
	.height(450)
	.prepare();

client.run([
		barrierSubscribeClicks,
		barrierSignInClicks
	], function(err, response){
		console.log('error', err);
		console.log('result', response);
		barrierCTAClicksChart.parseRawData(
			{
				result : [
					{
						name: 'Clicks subscribe link',
						value : response[0].result[1]
					},
					{
						name: 'Clicks sign-up link',
						value : response[1].result[1]
					}
				]
			}
		).render();
	}
);
