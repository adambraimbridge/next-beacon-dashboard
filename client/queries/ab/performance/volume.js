/* global Keen */
'use strict';
var client = require('../../../lib/wrapped-keen');
var d = new Date();
var timeframe = {
	"start":"2015-09-28T00:00:00.000+00:00",
	"end":d.toISOString()
}

var volumeChart = new Keen.Dataviz()
	.el(document.getElementById("volume-chart"))
	.chartType("linechart")
	.chartOptions({
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	})
	.title('Webpage view counts per day')
	.height(450)
	.prepare();

var volumeQuery = new Keen.Query("count", {
	filters: [{
		operator:"exists",
		property_name:"ab.performanceAB",
		property_value:true
	}],
	eventCollection: "dwell",
	groupBy: "ab.performanceAB",
	interval: "daily",
	timeframe: timeframe,
	timezone: "UTC",
	maxAge: 10800
});

module.exports.run = function() {
	client.run(volumeQuery, function(err, res) {
		_.each(res, function(days) {
			_.each(days, function(day) {
				_.each(day.value, function(group) {
					if (group['ab.performanceAB'] === 'on') {
						group['ab.performanceAB'] = 'Group A';
					}
					else if(group['ab.performanceAB'] === 'off') {
						group['ab.performanceAB'] = 'Group B';
					}
				});
			});
		});

		if (err) {
			volumeChart.error(err.message);
		}
		else {
			volumeChart
				.parseRequest(this)
				.render();
		}
	});
};
