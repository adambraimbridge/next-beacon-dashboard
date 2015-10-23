'use strict';

var util = require('./util');

module.exports = function (data) {

	Promise.all(['articleViewsFromMyFt', 'articleViews'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisArticleViewsFromMyFt, prevArticleViewsFromMyFt, thisArticleViews, prevArticleViews]) {

			util.drawMultiColumnChart({
				title: 'Percentage of article views directly from myFT',
				data: [{
					label: '',
					values: [
						{
							label: "Now",
							result: 100 * thisArticleViewsFromMyFt.result/thisArticleViews.result
						},
						{
							label: "Prev",
							result: 100 * prevArticleViewsFromMyFt.result/prevArticleViews.result
						}
					]
				}],
				id: "referrals_myft_percent",
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
