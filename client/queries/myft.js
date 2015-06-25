'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var queryTimeframe = queryParameters.timeframe || "this_14_days";
var previousTimeframe  = queryTimeframe.replace('this', 'previous');

var queryRealUsers = function(options) {
	var query = options.query || 'count_unique';
	var parameters = {
		eventCollection: options.eventCollection || "dwell",
		timeframe: options.timeframe || queryTimeframe,
		targetProperty: options.targetProperty,
		timezone: "UTC",
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}].concat(options.filters || []),
		maxAge: 3600
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


function init (client) {


	var thisAllUsers = queryRealUsers({
		eventCollection: "dwell",
		targetProperty: "user.uuid",
		interval: false
	});

	var prevAllUsers = queryRealUsers({
		eventCollection: "dwell",
		targetProperty: "user.uuid",
		timeframe: previousTimeframe,
		interval: false
	});

	var thisFollowUsers = queryRealUsers({
		eventCollection: "dwell",
		filters: [{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
		groupBy: "user.myft.topicsFollowed",
		targetProperty: "user.uuid",
		interval: false
	});

	var prevFollowUsers = queryRealUsers({
		eventCollection: "dwell",
		filters: [{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
		groupBy: "user.myft.topicsFollowed",
		targetProperty: "user.uuid",
		timeframe: previousTimeframe,
		interval: false
	});

	client.run([thisFollowUsers, prevFollowUsers, thisAllUsers, prevAllUsers], function (err, [thisFollowUsers, prevFollowUsers, thisAllUsers, prevAllUsers]) {
		if(!err) {

			function extractCount (resultSet, i) {
				return (resultSet.result.find(r => r['user.myft.topicsFollowed'] === i) || {result: 0}).result;
			}

			function aggregatedAverages (start, finish) {
				var thisUserCount = 0;
				var thisArticleViewCount = 0;
				var prevUserCount = 0;
				var prevArticleViewCount = 0;
				for (var i = start, il = finish + 1; i < il; i++) {
					thisUserCount += extractCount(thisFollowUsers, i);
					prevUserCount += extractCount(prevFollowUsers, i);
				};
				return {
      		label: start === finish ? ''+start : [start, finish].join(' - '),
					values: [
						{
							label: "Now",
							result: thisUserCount/thisAllUsers.result
						},
						{
							label: "Prev",
							result: prevUserCount/prevAllUsers.result
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


			drawMultiColumnChart({
				title: 'Follows per user',
				data: groupedResults,
				id: "bar_follows_user",
				h: {
					label: 'Topics Followed'
				},
				v: {
					label: '% of users'
				}
			});
		}
	});

	var piechart = new Keen.Dataviz()
		.el(document.getElementById("pie_articles_myft"))
		.chartType("piechart")
		.title('Proportion of articles viewed from myFT')
		.height(300)
		.prepare();

	var piechartPrevious = new Keen.Dataviz()
		.el(document.getElementById("pie_articles_myft--previous"))
		.chartType("piechart")
		.title('Proportion of articles viewed from myFT - last weeks')
		.height(300)
		.prepare();

	var piecharts = [piechart, piechartPrevious];

	var articleViewsByHash = queryRealUsers({
		query: 'count',
		eventCollection: "dwell",
		groupBy: "page.location.hash",
		timezone: "UTC"
	});
	var articleViewsByHashPrevious = queryRealUsers({
		query: 'count',
		eventCollection: "dwell",
		groupBy: "page.location.hash",
		timeframe: previousTimeframe,
		timezone: "UTC"
	});



	client.run([articleViewsByHash, articleViewsByHashPrevious], function(err, results) {
		if(!err) {
			results.forEach(function(response, index) {
				var myFTOnly = [{
					"source": "myft",
					"result": 0
				}, {
					"source": "other",
					"result": 0
				}]
				response.result.forEach(function(hash) {
					if(hash['page.location.hash'] && hash['page.location.hash'].indexOf('myft') >= 0) {
						myFTOnly[0].result += hash.result
					} else {
						myFTOnly[1].result += hash.result
					}
				});

				piecharts[index]
					.parseRawData({"result": myFTOnly})
					.render();
			});
		}

	});

	var articlesPerUserQueries = {
		thisUsers: queryRealUsers({
			eventCollection: "dwell",
			filters: [{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
			groupBy: "user.myft.topicsFollowed",
			targetProperty: "user.uuid",
			interval: false
		}),
		thisArticleViews: queryRealUsers({
			query: 'count',
			eventCollection: "dwell",
			filters: [{"operator":"eq","property_name":"page.location.type","property_value":"article"},{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
			groupBy: "user.myft.topicsFollowed",
			interval: false
		}),
		prevUsers: queryRealUsers({
			eventCollection: "dwell",
			filters: [{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
			groupBy: "user.myft.topicsFollowed",
			targetProperty: "user.uuid",
			timeframe: previousTimeframe,
			interval: false
		}),
		prevArticleViews: queryRealUsers({
			query: 'count',
			eventCollection: "dwell",
			filters: [{"operator":"eq","property_name":"page.location.type","property_value":"article"},{"operator":"exists","property_name":"user.myft.topicsFollowed","property_value":true}],
			groupBy: "user.myft.topicsFollowed",
			timeframe: previousTimeframe,
			interval: false
		})
	};



	client.run(Object.keys(articlesPerUserQueries).map(s => articlesPerUserQueries[s]),
		function (err, [thisUsers, thisArticleViews, prevUsers, prevArticleViews]) {
		if(!err) {


			function extractCount (resultSet, i) {
				return (resultSet.result.find(r => r['user.myft.topicsFollowed'] === i) || {result: 0}).result;
			}

			function aggregatedAverages (start, finish) {
				var thisUserCount = 0;
				var thisArticleViewCount = 0;
				var prevUserCount = 0;
				var prevArticleViewCount = 0;
				for (var i = start, il = finish + 1; i < il; i++) {
					thisUserCount += extractCount(thisUsers, i);
					thisArticleViewCount += extractCount(thisArticleViews, i);
					prevUserCount += extractCount(prevUsers, i);
					prevArticleViewCount += extractCount(prevArticleViews, i);
				};
				return {
      		label: start === finish ? ''+start : [start, finish].join(' - '),
					values: [
						{
							label: "Now",
							result: thisArticleViewCount/thisUserCount
						},
						{
							label: "Prev",
							result: prevArticleViewCount/prevUserCount
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

			drawMultiColumnChart({
				title: 'Article views per user, grouped by follow engagement',
				data: groupedResults,
				id: "bar_articles_user",
				h: {
					label: 'Topics Followed'
				},
				v: {
					label: 'Articles per user'
				}
			});

		}
	});

	var queryMyFTReferredArticles = queryRealUsers({
		filters: [
			{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
			{"operator":"eq","property_name":"page.location.type","property_value":"article"}
		],
		groupBy: "page.location.hash",
		interval: "daily",
		targetProperty: "user.uuid"
	});

	var queryMyFTReferredArticlesSnapshot = queryRealUsers({
		filters: [
			{"operator":"contains","property_name":"page.location.hash","property_value":"myft"},
			{"operator":"eq","property_name":"page.location.type","property_value":"article"}
		],
		groupBy: "page.location.hash",
		targetProperty: "user.uuid",
		interval: false
	});


	client.draw(queryMyFTReferredArticles, document.getElementById("myft-referred-articles"), {
		height: 400,
	});

	client.draw(queryMyFTReferredArticlesSnapshot, document.getElementById("myft-referred-articles-pie"), {
		height: 400
	});




}






function drawMultiColumnChart({title, data, id, v, h}) {
  var tabulatedData = new google.visualization.DataTable();

  tabulatedData.addColumn('string', h.label);

  data[0].values.forEach(function (val) {
  	tabulatedData.addColumn('number', val.label);
  });

  tabulatedData.addRows(data.map(function (res) {
  	return [res.label].concat(res.values.map(v => v.result));
  }));

  var options = {
    title: title,
    annotations: {
      alwaysOutside: true,
      textStyle: {
        fontSize: 14,
        color: '#000',
        auraColor: 'none'
      }
    },
    hAxis: {
      title: h.label,
      viewWindow: {
        min: [7, 30, 0],
        max: [17, 30, 0]
      }
    },
    vAxis: {
      title: v.label
    }
  };

  var chart = new google.visualization.ColumnChart(document.getElementById(id));
  chart.draw(tabulatedData, options);
}







module.exports = {
	init: init
};

