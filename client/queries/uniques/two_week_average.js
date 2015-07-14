/* global Keen */

'use strict';

module.exports = {

	query: new Keen.Query("count_unique", {
		eventCollection: "dwell",
		target_property: "user.uuid",
		timeframe: "last_14_days",
		interval: "daily",
		filters: [{
			"property_name":"time.weekday",
			"operator":"eq",
			"property_value":true
		}],
		maxAge: 10800
	}),

	render: function (el, results) {

		var sum = results.result.map(function (c) {
			return c.value;
		}).reduce(function (a, b) {
			return a + b;
		});

		new Keen.Dataviz()
			.el(el)
			.parseRawData({ result: parseInt((sum / 10).toFixed()) })
			.chartType("metric")
			.title("Average daily total <small>(excluding weekends)<br/>Calculated from unique user counts for the previous 14 days, excluding today and weekends.</small>")
			.render();
	}
};
