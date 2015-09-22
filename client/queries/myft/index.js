'use strict';

var util = require('./util');

function init (client) {

	var data = util.fetch(client, {
		unique: {

		},
		compare: {
			allUsers: {
				eventCollection: "dwell",
				targetProperty: "user.uuid",
				interval: false
			},
			followUsers: {
				eventCollection: "dwell",
				filters: [{"operator":"exists","property_name":"userPrefs.following","property_value":true}],
				groupBy: "userPrefs.following",
				targetProperty: "user.uuid",
				interval: false
			},
			followClicks: {
				query: 'count',
				eventCollection: "cta",
				filters: [
					{"operator":"contains","property_name":"meta.domPath","property_value":'follow'},
					{"operator":"eq","property_name":"meta.domPressed","property_value":false}
				],
				interval: false
			},
			followClicksByUser: {
				targetProperty: "user.uuid",
				eventCollection: "cta",
				filters: [
					{"operator":"contains","property_name":"meta.domPath","property_value":'follow'},
					{"operator":"eq","property_name":"meta.domPressed","property_value":false}
				],
				interval: false
			},
			articleViewsByFollowCount: {
				query: 'count',
				eventCollection: "dwell",
				filters: [
					{"operator":"eq","property_name":"page.location.type","property_value":"article"},
					{"operator":"exists","property_name":"userPrefs.following","property_value":true}
				],
				groupBy: "userPrefs.following",
				interval: false
			},
			articleViews: {
				query: 'count',
				eventCollection: "dwell",
				filters: [{"operator":"eq","property_name":"page.location.type","property_value":"article"}],
				interval: false
			},
			uniqueArticleViewsByHash: {
				query: 'count_unique',
				targetProperty: 'user.uuid',
				filters: [
					{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
					{"operator":"eq","property_name":"page.location.type","property_value":"article"}
				],
				groupBy: "page.location.hash",
				eventCollection: "dwell",
				interval: false
			},
			articleViewsByHash: {
				query: 'count',
				filters: [
					{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
					{"operator":"eq","property_name":"page.location.type","property_value":"article"}
				],
				groupBy: "page.location.hash",
				eventCollection: "dwell",
				interval: false
			},
			articleViewsFromMyFt: {
				query: 'count',
				filters: [
					{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
					{"operator":"eq","property_name":"page.location.type","property_value":"article"}
				],
				eventCollection: "dwell",
				interval: false
			},
		}
	});

	require('./follows-per-user')(data);
	require('./follow-clicks')(data, client);
	require('./articles-per-follow')(data);

	require('./article-referrals')(data);

	require('./articles-by-hash')(client);
	require('./feature-comparison')(data, client);

}


module.exports = {
	init: init
};
