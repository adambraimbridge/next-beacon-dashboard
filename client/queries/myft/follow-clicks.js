'use strict';

var util = require('./util');

module.exports = function (data, client) {

	Promise.all(['followClicks', 'followClicksByUser', 'allUsers'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisFollowClicks, prevFollowClicks, thisFollowClicksByUser, prevFollowClicksByUser, thisAllUsers, prevAllUsers]) {

			util.drawMultiColumnChart({
				title: 'Follow clicks per user',
				data: [{
					label: '',
					values: [
						{
							label: "Now - clicks per user",
							result: thisFollowClicks.result/thisAllUsers.result
						},
						{
							label: "Prev - clicks per user",
							result: prevFollowClicks.result/prevAllUsers.result
						},
						{
							label: "Now - % of users clicking",
							result: 100 * thisFollowClicksByUser.result/thisAllUsers.result
						},
						{
							label: "Prev - % of users clicking",
							result: 100 * prevFollowClicksByUser.result/prevAllUsers.result
						}
					]
				}],
				id: "follow_clicks_per_user",
				h: {
					title: ''
				},
				v: {
					title: 'Clicks per user / % users clicking',
					minValue: 0
				}
			});

		});

		client.draw(util.queryRealUsers({
			eventCollection: 'cta',
			filters: [
				{"operator":"contains","property_name":"meta.domPath","property_value":'follow'},
				{"operator":"eq","property_name":"meta.domPressed","property_value":false}
			],
			groupBy: "page.location.type",
			interval: "daily",
			targetProperty: "user.uuid"
		}), document.getElementById("follow_users_per_page"), {
			height: 400,
		});

		client.draw(util.queryRealUsers({
			eventCollection: 'cta',
			filters: [
				{"operator":"contains","property_name":"meta.domPath","property_value":'follow'},
				{"operator":"eq","property_name":"meta.domPressed","property_value":false}
			],
			groupBy: "page.location.type",
			interval: "daily",
			query: 'count'
		}), document.getElementById("follow_clicks_per_page"), {
			height: 400,
		});
};
