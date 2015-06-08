/* global Keen */

'use strict';

var querystring = require('querystring');
var qs = querystring.parse(location.search.slice(1));

module.exports.continent = {

	query: new Keen.Query("count_unique", {
		eventCollection: "dwell",
		timeframe: qs.timeframe || "this_14_days",
		targetProperty: "user.uuid",
		group_by: ["user.geo.continent"],
		interval: "daily"
	})

};

module.exports.country = {

	query: new Keen.Query("count_unique", {
		eventCollection: "dwell",
		timeframe: qs.timeframe || "this_14_days",
		targetProperty: "user.uuid",
		group_by: ["user.geo.country_name"]
	})

};
