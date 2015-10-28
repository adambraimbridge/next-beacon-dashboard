/* global Keen , keen_project, keen_read_key */

'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));
var referrerParameter = queryParameters.referrerType;
var searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"
}];
var socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"
}];
var standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true}];
var referrerFilters;
var chartHeadingModifier;

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});
var chartAverage = new Keen.Dataviz();
var chartDistribution = new Keen.Dataviz();

var uniqueSessionsQuery =	function() {
	var parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(standardQueryFilters)
			.concat(referrerFilters),
		targetProperty: "ingest.device.spoor_session",
		timeframe: !referrerParameter ? 'this_1_minute' : (queryParameters.timeframe || 'previous_2_weeks'),
		timezone: "UTC",
		maxAge:10800
	};
	console.log('parameters ', parameters);
	return new Keen.Query("select_unique", parameters);
};

var articleDepthQuery =	function(referredSessionsArray) {
	var referredSessionsFilter;
	if (!referrerParameter) {
		referredSessionsFilter = [] ;
	} else {
		referredSessionsFilter = [
			{"operator":"in",
			"property_name": "ingest.device.spoor_session",
			"property_value": referredSessionsArray}];
	}
	var parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referredSessionsFilter)
			.concat(standardQueryFilters),
		groupBy: "ingest.device.spoor_session",
		interval: "weekly",
		timeframe: queryParameters.timeframe || 'previous_2_weeks',
		timezone: "UTC",
		maxAge:10800
	};
	console.log('parameters ', parameters);
	return new Keen.Query("count", parameters);
};

var distributionTransform = function (results) {

	var uniqueTimeframes = [];
	results.result.forEach(function (result) {
		if (uniqueTimeframes.indexOf(result.timeframe) === -1) {
			uniqueTimeframes.push(result.timeframe);
		}
	});

	var uniqueTimeframesBuckets = [];
	uniqueTimeframes.forEach(function(timeframe) {
		uniqueTimeframesBuckets.push({
			value: [
				{bMin: 1, bMax: 1, bFreq: 0, result: 0},
				{bMin: 2, bMax: 2, bFreq: 0, result: 0},
				{bMin: 3, bMax: 3, bFreq: 0, result: 0},
				{bMin: 4, bMax: 6, bFreq: 0, result: 0},
				{bMin: 7, bMax: 9, bFreq: 0, result: 0},
				{bMin: 10, bMax: 19, bFreq: 0, result: 0},
				{bMin: 20, bMax: 999, bFreq: 0, result: 0}
			],
			timeframe: timeframe,
			subscribers: 0});
	});

	results.result.forEach(function(result) {
		result.value.forEach(function (value) {
			if (value.result > 0) {
				uniqueTimeframesBuckets.forEach(function(timeframeBucket){
					if (JSON.stringify(result.timeframe) === JSON.stringify(timeframeBucket.timeframe)) {
						timeframeBucket.value.forEach(function(bucket) {
							if (value.result >= bucket.bMin && value.result <= bucket.bMax) {
								bucket.bFreq ++;
								timeframeBucket.subscribers ++;
							}
						});
					}
				});
			}
		});
	});

	uniqueTimeframesBuckets.forEach(function(timeframeBucket) {
		timeframeBucket.value.forEach(function(bucket) {
			bucket.result = parseInt((bucket.bFreq*100) / timeframeBucket.subscribers);
			bucket.bMin === bucket.bMax ? bucket.articles = bucket.bMin.toString() : bucket.articles = bucket.bMin + ' to ' + bucket.bMax;
			delete bucket.bFreq;
			delete bucket.bMax;
			delete bucket.bMin;
		});
	});

	return uniqueTimeframesBuckets;
};

switch (referrerParameter) {
	case 'search':
		referrerFilters = searchReferrer;
		chartHeadingModifier = '(page referred by SEARCH)';
		break;
	case 'social':
		referrerFilters = socialReferrer;
		chartHeadingModifier = '(page referred by SOCIAL)';
		break;
	default:
		referrerFilters = [];
		chartHeadingModifier = '(page referred by ALL SOURCES)';
}

chartAverage
	.el(document.getElementById("session-referred-article-depth-average"))
	.height(450)
	.title('Average Article Views by session - ' + chartHeadingModifier)
	.prepare();

chartDistribution
	.el(document.getElementById("session-referred-article-depth-distribution"))
	.height(450)
	.title('Distribution of Article Views by session - ' + chartHeadingModifier)
	.prepare();


client.run(uniqueSessionsQuery(), function(err, res) {
	if (err) {
		console.log('Err ', err) ;
	}

	var uniqueSessionsQueryResult = !res ? [] : res.result;

	client.run(articleDepthQuery(uniqueSessionsQueryResult), function(err, res) {
		if (err) {
			console.log('Err ', err) ;
		}

		var averageResultArray = [];
		var uniqueTimeframes = [];

		res.result.map(function (result) {
			if (uniqueTimeframes.indexOf(result.timeframe) === -1) {
				uniqueTimeframes.push(result.timeframe);
			}
		});

		uniqueTimeframes.map(function (timeframe) {
			averageResultArray.push({timeframe: timeframe, sessions: 0, articles: 0});

		});

		res.result.map(function (result) {
			result.value.map(function (value) {
				if (value.result > 0) {
					averageResultArray.map(function(averageResult) {
						if (JSON.stringify(result.timeframe) === JSON.stringify(averageResult.timeframe)) {
							averageResult.sessions ++;
							averageResult.articles += value.result;
						}
					});
				}
			});
		});

		averageResultArray.map(function(averageResult) {
			averageResult.value = Number((averageResult.articles / averageResult.sessions).toFixed(2));
			delete averageResult.articles;
			delete averageResult.sessions;
		});

		chartAverage
			.data({result: averageResultArray})
			.chartType('linechart')
			.render();

		var distributionArray = distributionTransform(res);

		chartDistribution
			.data({result: distributionArray})
			.chartType("areachart")
			.chartOptions({isStacked: 'percent'})
			.render();

	});
});
