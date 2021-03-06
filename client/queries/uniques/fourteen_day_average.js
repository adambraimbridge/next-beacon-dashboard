/* global Keen */

'use strict';

module.exports = {

	query: new Keen.Query("count_unique", {
		eventCollection: "dwell",
		target_property: "user.uuid",
		timeframe: "previous_14_days",
		timezone: "UTC",
		maxAge: 10800
	}),

	render: function (el, results) {
		new Keen.Dataviz()
			.el(el)
			.parseRawData({ result: parseInt((results.result / 14).toFixed()) })
			.chartType("metric")
			.title("Average daily total <small>(including weekends)</small>")
			.render();
	}
};
