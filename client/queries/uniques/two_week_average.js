/* global Keen */

'use strict';

module.exports = {

	query: new Keen.Query("count_unique", {
		eventCollection: "dwell",
		target_property: "user.uuid",
		timeframe: "last_14_days",
		interval: "daily",
		filters: [{ "property_name":"time.weekday", "operator":"eq", "property_value":true }]
	}),

	render: function (el, results) {

		var sum = results.result.map(function (c) {
			return c.value;
		}).reduce(function (a, b) {
			return a + b;
		});

		new Keen.Dataviz()
			.el(el)
			.parseRawData({ result: sum / 10 })
			.chartType("metric")
			.colors(["#92CBC2"])
			.title("14 weekday average uniques")
			.render();
	}
};
