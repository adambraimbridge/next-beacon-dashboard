/*global google */

'use strict';

module.exports = function (data, client) {

	Promise.all(['articleViewsByHash', 'uniqueArticleViewsByHash'].reduce((arr, key) => {
		return arr.concat([data.this[key], data.prev[key]]);
	}, []))
		.then(function ([thisArticleViewsByHash, prevArticleViewsByHash, thisUniqueArticleViewsByHash, prevUniqueArticleViewsByHash]) {

			var rows = thisUniqueArticleViewsByHash.result.map(function (feature, index) {

				var users = feature['result'];
				var views = thisArticleViewsByHash.result.find(function(item) {
					return item['page.location.hash'] === feature['page.location.hash'];
				});

				var prevUsers = prevUniqueArticleViewsByHash.result.find(function(item) {
					return item['page.location.hash'] === feature['page.location.hash'];
				});
				var prevViews = prevArticleViewsByHash.result.find(function(item) {
					return item['page.location.hash'] === feature['page.location.hash'];
				});


				views = views ? views.result : 0;
				prevUsers = prevUsers ? prevUsers.result : 0;
				prevViews = prevViews ? prevViews.result : 0;
				return [
					feature['page.location.hash'],
					users,
					views,
					Math.round((prevViews / prevUsers) * 100 ) / 100,
					Math.round((views / users) * 100) / 100

				];
			});
			var data = new google.visualization.DataTable();
				data.addColumn('string', 'Feature');
				data.addColumn('number', 'Unique Views');
				data.addColumn('number', 'Total Views');
				data.addColumn('number', 'Views per user (last week)');

				data.addColumn('number', 'Views per user');

				data.addRows(rows);

				var table = new google.visualization.Table(document.getElementById('myft-feature-comparison'));

				table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});

		});
};
