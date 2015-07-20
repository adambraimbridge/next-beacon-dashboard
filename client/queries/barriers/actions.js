/* global Keen, keen_project, keen_read_key */
"use strict";

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var barrierViewsQuery = new Keen.Query("count", {
	eventCollection: "barrier",
	filters: [
		{"operator":"eq","property_name":"meta.type","property_value":"shown"}
	],
	interval: "daily",
	targetProperty: "user.device_id",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var barrierClicksQuery = new Keen.Query('count', {
	eventCollection: "cta",
	filters: [
		{"operator":"contains","property_name":"meta.domPath","property_value":"barrier"}
	],
	targetProperty: "meta.domPath",
	actorProperty: "user.device_id",
	interval: "daily",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});


var barrierSubscribeClicksQuery = new Keen.Query('count', {
	eventCollection: "cta",
	filters: [
		{"operator":"contains","property_name":"meta.domPath","property_value":"barrier"},
		{"operator":"contains","property_name":"meta.domPath","property_value":"subscribe"}
	],
	targetProperty: "meta.domPath",
	actorProperty: "user.device_id",
	interval: "daily",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var barrierSignInClicksQuery = new Keen.Query('count', {
	eventCollection: "cta",
	filters: [
		{"operator":"contains","property_name":"meta.domPath","property_value":"barrier"},
		{"operator":"contains","property_name":"meta.domPath","property_value":"sign-in"}
	],
	targetProperty: "meta.domPath",
	actorProperty: "user.device_id",
	interval: "daily",
	timeframe: queryParameters.timeframe || "this_14_days",
	timezone: "UTC"
});

var barrierClicksByElementQuery = new Keen.Query("count", {
	eventCollection: "cta",
	filters: [{"operator":"contains","property_name":"meta.domPath","property_value":"barrier"}],
	groupBy: "meta.domPath",
	timeframe: "this_14_days",
	timezone: "UTC"
});

var barrierInteractionsChart = new Keen.Dataviz()
	.el(document.getElementById('barrierInteractions'))
	.chartType('areachart')
	.height(450)
	.prepare();

client.run([
		barrierViewsQuery,
		barrierClicksQuery,
		barrierSubscribeClicksQuery,
		barrierSignInClicksQuery
	],
	function(err, response){
		if(err){
			console.error(err);
			return;
		}

		console.log(response);
		var data = response[0].result.map((item, index) => {
			return {
				timeframe: item.timeframe,
				value : [
					{
						type: 'Barriers Displayed',
						result: item.value
					},
					{
						type: 'Clicks subscribe link',
						result: response[2].result[index].value
					},
					{
						type: 'Clicks sign-up link',
						result: response[3].result[index].value
					},
					{
						type: 'Clicks other',
						result: response[1].result[index].value = response[3].result[index].value -response[2].result[index].value
					}
				]
			}
		});
		barrierInteractionsChart.parseRawData({result:data}).render();
	}
);

client.draw(barrierClicksByElementQuery, document.getElementById('barrierInteractionsByElement'), {
	height: 450
});

