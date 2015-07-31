/* global Keen , keen_project, keen_read_key, $ */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var commonFilters = [
	{"operator":"eq",
	"property_name":"user.isStaff",
	"property_value":false},
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"ne",
	"property_name":"user.layout",
	"property_value":""},
	{"operator":"ne",
	"property_name":"user.layout",
	"property_value":"none"},
	{"operator":"contains",
	"property_name":"user.uuid",
	"property_value":"-"}
];

var scrollDepth = new Keen.Query("count", {
	eventCollection: "scrolldepth",
	filters: commonFilters,
	groupBy: ["user.layout", "meta.percentageViewed"],
	targetProperty: "user.uuid",
	timeframe: queryParameters.timeframe || "previous_14_days",
	timezone: "UTC",
	maxAge:10800
});

var totalArticles = new Keen.Query("count", {
	eventCollection: "dwell",
	filters: commonFilters,
	groupBy: ["user.layout"],
	targetProperty: "user.uuid",
	timeframe: queryParameters.timeframe || "previous_14_days",
	timezone: "UTC",
	maxAge:10800
});

client.run(scrollDepth, function(err, result) {
	if(err) {
		console.log('scollDepth query error');
	} else {
		var scrollDepthResult = result.result;
		client.run(totalArticles, function(err, result) {
			if(err) {
				console.log('totalArticles error');
			} else {
				// merge in total articles with scroll depth for 0 scroll depth
				var totalArticlesResult = result.result;
				totalArticlesResult.forEach(function(result) {
					scrollDepthResult.push(
						{"meta.percentageViewed": 0,
						result: result.result,
						"user.layout": result["user.layout"]
					});
				});
				// sort the data set by layout then percentage viewed
				scrollDepthResult.sort(function(a,b) {
					if(a["user.layout"] === b["user.layout"]) {
						return (a["meta.percentageViewed"] - b["meta.percentageViewed"]);
					} else {
						return (a.result - b.result);
					}
				});
				// calculate how many got no further than each scroll depth
				scrollDepthResult.forEach(function(result) {
					switch (result["meta.percentageViewed"]) {
						case 0:
							if (scrollDepthResult.filter(function(item){
									return (item["user.layout"] === result["user.layout"] &&
										item["meta.percentageViewed"] === 25);
								}).length) {
									result.result = result.result - scrollDepthResult.filter(function(item){
											return (item["user.layout"] === result["user.layout"] &&
												item["meta.percentageViewed"] === 25);
										})[0].result;
								}
							break;
						case 25:
							if (scrollDepthResult.filter(function(item){
								return (item["user.layout"] === result["user.layout"] &&
									item["meta.percentageViewed"] === 50);
							}).length) {
								result.result = result.result - scrollDepthResult.filter(function(item){
									return (item["user.layout"] === result["user.layout"] &&
										item["meta.percentageViewed"] === 50);
								})[0].result;
							}
							break;
						case 50:
							if (scrollDepthResult.filter(function(item){
								return (item["user.layout"] === result["user.layout"] &&
									item["meta.percentageViewed"] === 75);
							}).length) {
								result.result = result.result - scrollDepthResult.filter(function(item){
									return (item["user.layout"] === result["user.layout"] &&
										item["meta.percentageViewed"] === 75);
								})[0].result;
							}
							break;
						case 75:
							if (scrollDepthResult.filter(function(item){
								return (item["user.layout"] === result["user.layout"] &&
									item["meta.percentageViewed"] === 100);
							}).length) {
								result.result = result.result - scrollDepthResult.filter(function(item){
									return (item["user.layout"] === result["user.layout"] &&
										item["meta.percentageViewed"] === 100);
								})[0].result;
							}
							break;
						default:
							console.log('This should be 100: ', result["meta.percentageViewed"]);
						}
					});
					// extract the different layouts
					var distinctUserLayouts = [];
					scrollDepthResult.forEach(function(result) {
						if (distinctUserLayouts.indexOf(result["user.layout"]) === -1) {
							distinctUserLayouts.push(result["user.layout"]);
						}
					});
					// make the final data structure for the table
					var dataVizArray = [];
					distinctUserLayouts.forEach(function(userLayout) {
						var userLayoutValues = [];
						scrollDepthResult.forEach(function(result) {
							if (result["user.layout"] === userLayout) {
								userLayoutValues.push(
									{percentViewed: result["meta.percentageViewed"],
									result: result.result});
							}
						});
						dataVizArray.push({userLayout: userLayout, total: 0, value: userLayoutValues});
					});
					// get the total views per layout to calculate percentages
					dataVizArray.forEach(function(dataViz) {
						dataViz["value"].forEach(function(value) {
							dataViz.total += value.result;
						});
					});

					//draw the table
					var table = $('<table>')
								.addClass("o-table o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

					var tr = $('<tr>')
						.append($('<th>').text('').attr("colspan","2"))
						.append($('<th>').text('Furthest % depth of article reached').attr("colspan", "5"));

					tr.appendTo(table);

					tr = $('<tr>')
						.append($('<th>').text('Screen Size'))
						.append($('<th data-o-table-data-type="numeric">').text('Total Pages'))
						.append($('<th data-o-table-data-type="numeric">').text('0-24%'))
						.append($('<th data-o-table-data-type="numeric">').text('25 - 49%'))
						.append($('<th data-o-table-data-type="numeric">').text('50 - 74%'))
						.append($('<th data-o-table-data-type="numeric">').text('75 - 99%'))
						.append($('<th data-o-table-data-type="numeric">').text('100%'));

					tr.appendTo(table);

					dataVizArray.forEach(function(dataViz) {
						tr = $('<tr>')
							.append($('<td>').text(dataViz.userLayout))
							.append($('<td data-o-table-data-type="numeric">').text(dataViz.total));
						dataViz.value.forEach(function(value) {
							tr.append($('<td data-o-table-data-type="numeric">').text(Math.round(value.result / dataViz.total * 100) + '%'));
						});
						tr.appendTo(table);
					});

					var el = document.getElementById("scroll-depth__table");
					table.appendTo($(el));
				}
		});
	}
});
