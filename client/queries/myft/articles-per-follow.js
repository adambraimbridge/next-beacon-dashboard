'use strict';

var util = require('./util');

module.exports = function (data) {
	Promise.all(['followUsers', 'articleViewsByFollowCount'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisFollowUsers, prevFollowUsers, thisArticleViewsByFollowCount, prevArticleViewsByFollowCount]) {

			var extractCount = util.getValueExtractor('userPrefs.following');

			function aggregatedAverages (start, finish) {
				var thisUserCount = 0;
				var thisArticleViewCount = 0;
				var prevUserCount = 0;
				var prevArticleViewCount = 0;
				for (var i = start, il = finish + 1; i < il; i++) {
					thisUserCount += extractCount(thisFollowUsers, i);
					thisArticleViewCount += extractCount(thisArticleViewsByFollowCount, i);
					prevUserCount += extractCount(prevFollowUsers, i);
					prevArticleViewCount += extractCount(prevArticleViewsByFollowCount, i);
				}
				return {
					label: start === finish ? ''+start : [start, finish].join(' - '),
					values: [
						{
							label: "Now",
							result: 100 * thisArticleViewCount/thisUserCount
						},
						{
							label: "Prev",
							result: 100 * prevArticleViewCount/prevUserCount
						}
					]
				};
			}

			var groupedResults = [
				aggregatedAverages(0, 0),
				aggregatedAverages(1, 1),
				aggregatedAverages(2, 5),
				aggregatedAverages(6, 10),
				aggregatedAverages(11, 20),
				aggregatedAverages(21, 50),
				aggregatedAverages(51, 100)
			];

			util.drawMultiColumnChart({
				title: 'Article views per user, grouped by follow engagement',
				data: groupedResults,
				id: "bar_articles_user",
				h: {
					title: 'Topics Followed'
				},
				v: {
					title: 'Articles per user'
				}
			});
		});
};
