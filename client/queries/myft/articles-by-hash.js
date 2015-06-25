'use strict';

var util = require('./util');

module.exports = function (client) {

	client.draw(util.queryRealUsers({
		filters: [
			{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
			{"operator":"eq","property_name":"page.location.type","property_value":"article"}
		],
		groupBy: "page.location.hash",
		interval: "daily",
		targetProperty: "user.uuid"
	}), document.getElementById("myft-referred-articles"), {
		height: 400,
	});

	client.draw(util.queryRealUsers({
		filters: [
			{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
			{"operator":"eq","property_name":"page.location.type","property_value":"article"}
		],
		groupBy: "page.location.hash",
		targetProperty: "user.uuid",
		interval: false
	}), document.getElementById("myft-referred-articles-pie"), {
		height: 400,
	});

};
