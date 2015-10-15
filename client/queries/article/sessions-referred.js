/* global Keen , keen_project, keen_read_key */

'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));
var referrerParameter = queryParameters.referrerType || 'search';
var searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"
}];
var socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"
}];

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var keenQuery =	function() {
	var optionFilters;
	if (referrerParameter === 'social') {
		optionFilters = socialReferrer;
	} else {
		optionFilters = searchReferrer;
	}
	var parameters = {
		eventCollection: "dwell",
		filters: [
			// filters removed for staff and also page type as deprecated in CTA
			// {"operator":"eq",
			// "property_name":"user.isStaff",
			// "property_value":false},
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"article"},
			{"operator":"exists",
			"property_name":"user.uuid",
			"property_value":true}
		].concat(
				optionFilters
			),
		groupBy: "meta.domPath",
		interval: "daily",
		targetProperty: "ingest.device.spoor_session",
		timeframe: queryParameters.timeframe || 'previous_14_days',
		timezone: "UTC",
		maxAge:10800
	};

	return new Keen.Query("count_unique", parameters);
};

client.draw(keenQuery(), document.getElementById('session-referred'), {
	chartType: "linechart",
	title: 'Unique Sessions referred to Article Pages',
	chartOptions: {
		height: 450,
		legend: { position: "none" },
		curveType:'function',
		hAxis: {
			format: 'E d'
		},
		chartArea: {
			left: '10%',
			width: '75%'
		}
	}
});
