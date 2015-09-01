/* global Keen */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

module.exports.query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	target_property: queryParameters.target_property || "user.uuid",
	timeframe: "this_1_days",
	timezone: "UTC",
	maxAge: 10800
});
