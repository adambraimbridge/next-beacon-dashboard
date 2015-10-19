/* global Keen */
'use strict';
var client = require('../../../lib/wrapped-keen');

var daysAgo = function (n) {
	n = n || 0;
	var d = new Date();
	d.setDate(d.getDate() - n);
	d.setUTCHours(0,0,0,0);
	return d.toISOString();
};

var frequencyChartA = new Keen.Dataviz()
	.el(document.getElementById("metric_average_frequency__a"))
	.chartType("metric")
	.title('Group A')
	.height(140)
	.prepare();

var frequencyChartB = new Keen.Dataviz()
	.el(document.getElementById("metric_average_frequency__b"))
	.chartType("metric")
	.title('Group B')
	.height(140)
	.prepare();

var uuidQuery = new Keen.Query("count_unique", {
	filters: [{
		operator:"exists",
		property_name:"ab.performanceAB",
		property_value:true
	}],
	eventCollection: "dwell",
	groupBy: "user.uuid",
	targetProperty: "user.uuid",
	timeframe: {
		"start":"2015-09-28T00:00:00.000+00:00",
		"end":daysAgo()
	},
	maxAge: 10800
});

module.exports.run = function() {
	client.run(uuidQuery, function(err, res) {
		var uuids = _.pluck(res.result, 'user.uuid');

		var frequencyQuery = new Keen.Query("count_unique", {
			filters: [{
				operator:"exists",
				property_name:"ab.performanceAB",
				property_value:true
			},
			{
				operator:"in",
				property_name:"user.uuid",
				property_value:uuids
			}],
			eventCollection: "dwell",
			groupBy: ["user.uuid","ab.performanceAB"],
			targetProperty: "time.day",
			timeframe: {
				"start":daysAgo(90),
				"end":daysAgo()
			},
			maxAge: 10800
		});
		client.run(frequencyQuery, function(err, res) {
			var groups = _.map(_.partition(res.result, {'ab.performanceAB':'on'}));
			var averageFrequencyA, averageFrequencyB;

			// groups[0] = Group A; groups[1] = Group B
			averageFrequencyA = _.sum(groups[0],'result')/groups[0].length;
			averageFrequencyB = _.sum(groups[1],'result')/groups[1].length;

			frequencyChartA
				.parseRawData({ result:parseFloat(averageFrequencyA) })
				.render();

			frequencyChartB
				.parseRawData({ result:parseFloat(averageFrequencyB) })
				.render();

		});
	});
};
