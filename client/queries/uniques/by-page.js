/* global Keen */

'use strict';

var querystring = require('querystring');
var qs = querystring.parse(location.search.slice(1));

module.exports.query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	timeframe: qs.timeframe || "this_14_days",
	targetProperty: "user.uuid",
	group_by: ["page.location.type"],
	interval: "daily"
});
