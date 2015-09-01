/* global Keen */

'use strict';

module.exports =	{

	query: new Keen.Query("count", {
			eventCollection: "dwell",
			targetProperty: "page.location.pathname",
			filters: [
				// filter removed as deprecated (temporarily?)
				// {operator:"eq",
				// property_name:"user.isStaff",
				// property_value:false},
				{operator:"eq",
				property_name:"page.location.type",
				property_value:"article"}
			],
			timeframe: "previous_7_days",
			timezone: "UTC",
			maxAge: 10800
	}),

	render: function(el, results) {
		console.log(results);
		new Keen.Dataviz()
			.el(el)
			.parseRawData({ result: parseInt((results.result / 7).toFixed()) })
			.chartType("metric")
			.title("Last 7 Days Average")
			.render();
	}

};
