'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var queryTimeframe = queryParameters.timeframe || "this_14_days";
var previousTimeFrame  = queryTimeframe.replace('this', 'previous');


var keenQuery = function(options) {
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


function init(client) {

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

	var articleViewsByHash = new Keen.Query("count", {
	  eventCollection: "dwell",
	  groupBy: "page.location.hash",
	  timeframe: queryTimeframe,
	  timezone: "UTC"
	});
	var articleViewsByHashPrevious = new Keen.Query("count", {
	  eventCollection: "dwell",
	  groupBy: "page.location.hash",
	  timeframe: previousTimeFrame,
	  timezone: "UTC"
	});


	var queryMyFTReferredArticles = keenQuery({
		filters: [{"operator":"contains","property_name":"page.location.hash","property_value":"myft"}],
		groupBy: "page.location.hash",
		interval: "daily",
		targetProperty: "user.uuid"
	});

	var queryMyFTReferredArticlesSnapshot = keenQuery({
		filters: [{"operator":"contains","property_name":"page.location.hash","property_value":"myft"}],
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
					if(hash['page.location.hash'].indexOf('myft') >= 0) {
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
}

module.exports = {
	init: init
};

