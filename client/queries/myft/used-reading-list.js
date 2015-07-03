'use strict';

var util = require('./util');

module.exports = function (data, client) {

	Promise.all(['articleViewsFromMyFt', 'usedReadingList'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisArticleViewsFromMyFt, prevArticleViewsFromMyFt, thisUsedReadingList, prevUsedReadingList]) {

			util.drawMultiColumnChart({
				title: 'Percentage of article views directly from myFT',
				data: [{
					label: '',
					values: [
						{
							label: "Now",
							result: 100 * thisUsedReadingList.result/thisArticleViewsFromMyFt.result
						},
						{
							label: "Prev",
							result: 100 * prevUsedReadingList.result/prevArticleViewsFromMyFt.result
						}
					]
				}],
				id: "readinglist_myft_percent",
				h: {
					title: ''
				},
				v: {
					title: '%',
					minValue: 0,
					maxValue: 10
				}
			});

		});
};
