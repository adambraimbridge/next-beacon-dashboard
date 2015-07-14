/* global Keen */

'use strict';

module.exports.query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	target_property: "user.uuid",
	timeframe: "this_1_days",
	timezone: "UTC",
	filters:[{
		property_name:"user.isStaff",
		operator:"eq",
		property_value:false
	}],
	maxAge: 10800
});
