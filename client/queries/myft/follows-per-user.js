'use strict';

var util = require('./util');

module.exports = function (data, client) {
	Promise.all(['followUsers', 'allUsers'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisFollowUsers, prevFollowUsers, thisAllUsers, prevAllUsers]) {

			var extractCount = util.getValueExtractor('user.myft.topicsFollowed');

			function aggregatedAverages (start, finish) {
				var thisUserCount = 0;
				var prevUserCount = 0;
				for (var i = start, il = finish + 1; i < il; i++) {
					thisUserCount += extractCount(thisFollowUsers, i);
					prevUserCount += extractCount(prevFollowUsers, i);
				}
				return {
					label: start === finish ? ''+start : [start, finish].join(' - '),
					values: [
						{
							label: "Now",
							result: 100 * thisUserCount/thisAllUsers.result
						},
						{
							label: "Prev",
							result: 100 * prevUserCount/prevAllUsers.result
						}
					]
				};
			}

			var groupedResults = [
				aggregatedAverages(1, 1),
				aggregatedAverages(2, 5),
				aggregatedAverages(6, 10),
				aggregatedAverages(11, 20),
				aggregatedAverages(21, 50),
				aggregatedAverages(51, 100)
			];


			util.drawMultiColumnChart({
				title: 'Follows per user',
				data: groupedResults,
				id: "bar_follows_user",
				h: {
					title: 'Topics Followed'
				},
				v: {
					title: '% of users'
				}
			});
		});
};
