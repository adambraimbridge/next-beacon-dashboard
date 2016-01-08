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
	"property_value": true},
	{"operator":"exists",
	"property_name":"ingest.device.spoor_session",
	"property_value":true}
];

const timeFrame = {"end":"2016-01-31T00:00:00.000+00:00","start":"2016-01-04T00:00:00.000+00:00"}

const client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

let referrerFilters;
let activeFilter;

const metricMoreThanOneVariant = new Keen.Dataviz();
const metricMoreThanOneControl = new Keen.Dataviz();

const metricAveragePageViewsVariant = new Keen.Dataviz();
const metricAveragePageViewsControl = new Keen.Dataviz();

const metricSessionsVariant = new Keen.Dataviz();
const metricSessionsControl = new Keen.Dataviz();

function uniqueSessionsQuery() {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(standardQueryFilters)
			.concat(referrerFilters),
		groupBy: "ingest.device.spoor_session",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function articleDepthQuery(uniqueSessionsArray) {
	let parameters = {
		eventCollection: "dwell",
		filters: [
			{"operator":"in",
			"property_name": "ingest.device.spoor_session",
			"property_value": uniqueSessionsArray}]
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
		{condition: "variant",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		},
		{condition: "control",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		}];

	results.result.map(function(result) {
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

metricMoreThanOneVariant
	.el(document.getElementById("metric-more-than-one__variant"))
	.height(450)
	.title("% More Than 1 Article - VARIANT")
	.prepare();

metricMoreThanOneControl
	.el(document.getElementById("metric-more-than-one__control"))
	.height(450)
	.title("% More Than 1 Article - CONTROL")
	.prepare();

metricAveragePageViewsVariant
	.el(document.getElementById("metric-average-pages__variant"))
	.height(450)
	.title("Average Article Page Views - VARIANT")
	.prepare();

metricAveragePageViewsControl
	.el(document.getElementById("metric-average-pages__control"))
	.height(450)
	.title("Average Article Page Views - CONTROL")
	.prepare();

metricSessionsVariant
	.el(document.getElementById("metric-number-sessions__variant"))
	.height(450)
	.title("Number Of Sessions - VARIANT")
	.prepare();

metricSessionsControl
	.el(document.getElementById("metric-number-sessions__control"))
	.height(450)
	.title("Number Of Sessions - CONTROL")
	.prepare();

client.run(uniqueSessionsQuery(), function(err, res) {
	if (err) {
		console.log('Err ', err) ;
	}

	const uniqueSessionsQueryResult = res.result.filter(session => session.result < 100)
					.map(session => session["ingest.device.spoor_session"]);

	client.run(articleDepthQuery(uniqueSessionsQueryResult), function(err, res) {
		if (err) {
			console.log('Err ', err);
		}
	const transformedResult = distributionTransform(res);
	const resultsVariant = transformedResult.find(res => res.condition === "variant");
	const resultsControl = transformedResult.find(res => res.condition === "control");

	metricMoreThanOneVariant
		.data({result: resultsVariant.moreThanOne})
		.chartType("metric")
		.render();

	metricMoreThanOneControl
		.data({result: resultsControl.moreThanOne})
		.chartType("metric")
		.render();

	metricAveragePageViewsVariant
		.data({result: resultsVariant.avgPageViews})
		.chartType("metric")
		.render();

	metricAveragePageViewsControl
		.data({result: resultsControl.avgPageViews})
		.chartType("metric")
		.render();

	metricSessionsVariant
		.data({result: resultsVariant.sessions})
		.chartType("metric")
		.render();

	metricSessionsControl
		.data({result: resultsControl.sessions})
		.chartType("metric")
		.render();

	});
});
