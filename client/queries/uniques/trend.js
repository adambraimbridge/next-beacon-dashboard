
var querystring = require('querystring');
var qs = querystring.parse(location.search.slice(1));

console.log(qs);

module.exports.query = new Keen.Query("count_unique", {
	eventCollection: "dwell",
	timeframe: qs.timeframe || "this_14_days",
	targetProperty: "user.uuid",
	interval: "daily"
});
