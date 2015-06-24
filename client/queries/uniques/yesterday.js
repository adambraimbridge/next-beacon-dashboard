/* global Keen */

'use strict';

module.exports.query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	target_property: "user.uuid",
	timeframe: "yesterday"
});
