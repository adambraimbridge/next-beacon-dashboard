/* global Keen, keen_project, keen_read_key, $ */

'use strict';

const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const referrerParameter = queryParameters.referrerType;

const searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"
}];

const socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"
}];

const standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true},
	{"operator":"exists",
	"property_name":"ab.articleMoreOnTopicCard",
	"property_value": true}
];

const timeFrame = {"end":"2016-01-31T00:00:00.000+00:00","start":"2016-01-04T00:00:00.000+00:00"}

const client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

let referrerFilters;
let activeFilter;

const metricMoreThanOneOn = new Keen.Dataviz();
const metricMoreThanOneOff = new Keen.Dataviz();

const metricAveragePageViewsOn = new Keen.Dataviz();
const metricAveragePageViewsOff = new Keen.Dataviz();

const metricSessionsOn = new Keen.Dataviz();
const metricSessionsOff = new Keen.Dataviz();

function uniqueSessionsQuery() {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(standardQueryFilters)
			.concat(referrerFilters),
		targetProperty: "ingest.device.spoor_session",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("select_unique", parameters);
}

function articleDepthQuery(referredSessionsArray) {
	let referredSessionsFilter;
	if (!referrerParameter) {
		referredSessionsFilter = [] ;
	} else {
		referredSessionsFilter = [
			{"operator":"in",
			"property_name": "ingest.device.spoor_session",
			"property_value": referredSessionsArray}];
	}
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referredSessionsFilter)
			.concat(standardQueryFilters),
		groupBy: ["ingest.device.spoor_session", "ab.articleMoreOnTopicCard"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function distributionTransform(results) {

	let resultsDistribution = [
		{condition: "on",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		},
		{condition: "off",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		}];

	results.result.map(function(result) {
		if (result["ab.articleMoreOnTopicCard"] === "variant") {
			result["ab.articleMoreOnTopicCard"] = "on";
		}
		if (result["ab.articleMoreOnTopicCard"] === "control") {
			result["ab.articleMoreOnTopicCard"] = "off";
		}
		if (result.result > 0) {
			resultsDistribution.map(function(dist){
				if (dist.condition === result["ab.articleMoreOnTopicCard"]) {
					dist.value.forEach(function(bucket) {
						if (result.result >= bucket.bMin && result.result <= bucket.bMax) {
							bucket.bFreq ++;
							dist.sessions ++;
							dist.pageViews += result.result;
						}
					});
				}
			});
		}
	});

	resultsDistribution.forEach(function(dist) {
		dist.value.forEach(function(bucket) {
			bucket.result = +((bucket.bFreq*100) / dist.sessions).toFixed(1);
			bucket.bMin === bucket.bMax ? bucket.articles = bucket.bMin.toString() : bucket.articles = bucket.bMin + ' to ' + bucket.bMax;
		});
		dist.conversions = dist.value.find(bucket => bucket.articles === "2 to 999").bFreq;
		dist.moreThanOne = dist.value.find(bucket => bucket.articles === "2 to 999").result;
		dist.avgPageViews = +(dist.pageViews / dist.sessions).toFixed(2);
		delete dist.value;
	});

	return resultsDistribution;
}

switch (referrerParameter) {
	case 'search':
		referrerFilters = searchReferrer;
		activeFilter = 'referred by SEARCH';
		break;
	case 'social':
		referrerFilters = socialReferrer;
		activeFilter = 'referred by SOCIAL';
		break;
	default:
		referrerFilters = [];
		activeFilter = 'referred by ALL SOURCES';
}

let activeFilterEl = $('<p>').text(activeFilter);
activeFilterEl.appendTo(document.getElementById("referrer-filter"));

metricMoreThanOneOn
	.el(document.getElementById("metric-more-than-one__on"))
	.height(450)
	.title("% More Than 1 Article - ON")
	.prepare();

metricMoreThanOneOff
	.el(document.getElementById("metric-more-than-one__off"))
	.height(450)
	.title("% More Than 1 Article - OFF")
	.prepare();

metricAveragePageViewsOn
	.el(document.getElementById("metric-average-pages__on"))
	.height(450)
	.title("Average Article Page Views - ON")
	.prepare();

metricAveragePageViewsOff
	.el(document.getElementById("metric-average-pages__off"))
	.height(450)
	.title("Average Article Page Views - OFF")
	.prepare();

metricSessionsOn
	.el(document.getElementById("metric-number-sessions__on"))
	.height(450)
	.title("Number Of Sessions - ON")
	.prepare();

metricSessionsOff
	.el(document.getElementById("metric-number-sessions__off"))
	.height(450)
	.title("Number Of Sessions - OFF")
	.prepare();

client.run(uniqueSessionsQuery(), function(err, res) {
	if (err) {
		console.log('Err ', err) ;
	}

	const uniqueSessionsQueryResult = !res ? [] : res.result;

	client.run(articleDepthQuery(uniqueSessionsQueryResult), function(err, res) {
		if (err) {
			console.log('Err ', err);
		}
	const transformedResult = distributionTransform(res);
	const resultsOn = transformedResult.find(res => res.condition === "on");
	const resultsOff = transformedResult.find(res => res.condition === "off");

	metricMoreThanOneOn
		.data({result: resultsOn.moreThanOne})
		.chartType("metric")
		.render();

	metricMoreThanOneOff
		.data({result: resultsOff.moreThanOne})
		.chartType("metric")
		.render();

	metricAveragePageViewsOn
		.data({result: resultsOn.avgPageViews})
		.chartType("metric")
		.render();

	metricAveragePageViewsOff
		.data({result: resultsOff.avgPageViews})
		.chartType("metric")
		.render();

	metricSessionsOn
		.data({result: resultsOn.sessions})
		.chartType("metric")
		.render();

	metricSessionsOff
		.data({result: resultsOff.sessions})
		.chartType("metric")
		.render();

	});
});
