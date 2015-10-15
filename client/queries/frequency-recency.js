/* global Keen, _ */
'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));
var queryTimeframe = queryParameters.timeframe || "this_14_days";

var keenQuery = function(options) {
	var query = options.query || 'count_unique';
	var parameters = {
		eventCollection: options.eventCollection || "dwell",
		timeframe: options.timeframe || queryTimeframe,
		targetProperty: options.targetProperty,
		timezone: "UTC",
		filters:options.filters || [],
		maxAge: 10800
	};

	if (options.groupBy) {
		parameters['groupBy'] = options.groupBy;
	}

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}

	return new Keen.Query(query, parameters);
};



function init(client) {

	var generateFrequencyRecencyStats = function(timeframe, idModifier, filters) {
		idModifier = idModifier || '';
		filters = filters || [];
		var metricAverageFrequency = new Keen.Dataviz()
			.el(document.getElementById("metric_average_frequency" + idModifier))
			.chartType("metric")
			.title(timeframe.replace(/_/g, ' '))
			.height(140)
			.prepare();

		var metricAverageRecency = new Keen.Dataviz()
			.el(document.getElementById("metric_average_recency" + idModifier))
			.chartType("metric")
			.title(timeframe.replace(/_/g, ' '))
			.height(140)
			.prepare();

		var queryLastVisitPerUser = keenQuery({
			timeframe: timeframe,
			query: 'maximum',
			targetProperty: 'time.day',
			groupBy: 'user.uuid',
			interval: false,
			filters: filters
		});

		var queryVisitsPerUser = keenQuery({
			timeframe: timeframe,
			targetProperty: 'time.day',
			groupBy: 'user.uuid',
			interval: false,
			filters: filters
		});


		client.run([queryVisitsPerUser, queryLastVisitPerUser], function(response) {
			var visitsPerUser = this.data[0].result;
			var lastVisitPerUser = this.data[1].result;
			var totalUniqueUsers = visitsPerUser.length;

			//Work out the average days visiting the site in the timeframe
			var averageVisitsPerUser = _.reduce(visitsPerUser, function(memo, user) {
				return memo + user.result;
			}, 0) / totalUniqueUsers;

			metricAverageFrequency
			.parseRawData({ result:parseFloat(averageVisitsPerUser) })
			.render();

			//Work out the average time (in days) since users last visit
			var maxDateInTimeframe = _.max(lastVisitPerUser, function(user) { return new Date(user.result) }).result;
			var averageDaysSinceLastVisit = _.reduce(lastVisitPerUser, function(memo, user) {
				return memo + ((new Date(maxDateInTimeframe) - new Date(user.result)) / 86400000);
			}, 0) / totalUniqueUsers;

			metricAverageRecency
			.parseRawData({ result:parseFloat(averageDaysSinceLastVisit) })
			.render();

		});

	};
	generateFrequencyRecencyStats(queryTimeframe);
	generateFrequencyRecencyStats(queryTimeframe.replace('this', 'previous'), '--previous');

	var isFollowing = {
		property_name:"userPrefs.following",
		operator:"gte",
		property_value:1
	};
	generateFrequencyRecencyStats(queryTimeframe, '--following', [isFollowing]);
	generateFrequencyRecencyStats(queryTimeframe.replace('this', 'previous'), '--following--previous', [isFollowing]);

}


module.exports = {
	init: init
};
