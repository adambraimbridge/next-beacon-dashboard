/* global Keen, keen_project, keen_read_key, $ */

'use strict';

const client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

const queryString = require('querystring');

const queryParameters = queryString.parse(location.search.substr(1));
const timeFrame = {"end":"2016-03-31T00:00:00.000+00:00","start":"2016-02-11T00:00:00.000+00:00"};

// Query Filters
const standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"ingest.context.is_inline",
	"property_value":false},
	{"operator":"exists",
	"property_name":"content.features.hasStoryPackage",
	"property_value":true},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true},
	{"operator":"exists",
	"property_name":"ab.articleMoreOnNumber",
	"property_value": true},
	{"operator":"exists",
	"property_name":"ingest.device.spoor_session",
	"property_value":true}
];

// User selected filters
const referrerBaseFilter = [{
				"operator":"eq",
				"property_name":"referringSource.websiteType",
				"property_value": queryParameters.referrerType
			}]
const referrerFilters = queryParameters.referrerType ? referrerBaseFilter : [];

function getDisplayFilter () {
	let displayParameters;
	switch (queryParameters.displayType) {
		case "computer":
			displayParameters = ["L", "XL"];
			break;
		case "tablet":
			displayParameters = ["M"];
			break;
		case "mobile":
			displayParameters = ["default", "XS", "S"];
			break;
		default:
			displayParameters = null;
	}
	return [{
					"operator":"in",
					"property_name":"ingest.user.layout",
					"property_value":displayParameters
				}];
}

const displayFilters = queryParameters.displayType ? getDisplayFilter() : [];

function pageViewsBySessionQuery() {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(standardQueryFilters)
			.concat(displayFilters)
			.concat(referrerFilters),
		groupBy: "ingest.device.spoor_session",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:1800
	};
	return new Keen.Query("count", parameters);
}

function articleDepthQuery(outliersSessionsFilter) {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(outliersSessionsFilter)
			.concat(referrerFilters)
			.concat(displayFilters)
			.concat(standardQueryFilters),
		groupBy: ["ingest.device.spoor_session", "ab.articleMoreOnNumber"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:1800
	};
	return new Keen.Query("count", parameters);
}

function distributionTransform(results) {

	let resultsDistribution = [
		{condition: "three",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		},
		{condition: "seven",
		sessions: 0,
		pageViews: 0,
		value: [
					{bMin: 1, bMax: 1, bFreq: 0, result: 0},
					{bMin: 2, bMax: 999, bFreq: 0, result: 0}
				],
		},
		{condition: "nine",
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
				if (dist.condition === result["ab.articleMoreOnNumber"]) {
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

const metricMoreThanOneThree = new Keen.Dataviz();
const metricMoreThanOneSeven = new Keen.Dataviz();
const metricMoreThanOneNine = new Keen.Dataviz();
const metricMoreThanOneControl = new Keen.Dataviz();

const metricAveragePageViewsThree = new Keen.Dataviz();
const metricAveragePageViewsSeven = new Keen.Dataviz();
const metricAveragePageViewsNine = new Keen.Dataviz();
const metricAveragePageViewsControl = new Keen.Dataviz();

const metricSessionsThree = new Keen.Dataviz();
const metricSessionsSeven = new Keen.Dataviz();
const metricSessionsNine = new Keen.Dataviz();
const metricSessionsControl = new Keen.Dataviz();

const activeReferrerFilterEl = $('<p>').text(queryParameters.referrerType || 'none');
activeReferrerFilterEl.appendTo(document.getElementById("referrer-filter"));

const activeDisplayFilterEl = $('<p>').text(queryParameters.displayType || 'none');
activeDisplayFilterEl.appendTo(document.getElementById("display-filter"));


metricMoreThanOneThree
	.el(document.getElementById("metric-more-than-one__three"))
	.height(450)
	.title("% More Than 1 Article - THREE")
	.prepare();

metricMoreThanOneSeven
	.el(document.getElementById("metric-more-than-one__seven"))
	.height(450)
	.title("% More Than 1 Article - SEVEN")
	.prepare();

metricMoreThanOneNine
	.el(document.getElementById("metric-more-than-one__nine"))
	.height(450)
	.title("% More Than 1 Article - NINE")
	.prepare();

metricMoreThanOneControl
	.el(document.getElementById("metric-more-than-one__control"))
	.height(450)
	.title("% More Than 1 Article - FIVE (C)")
	.prepare();

metricAveragePageViewsThree
	.el(document.getElementById("metric-average-pages__three"))
	.height(450)
	.title("Average Article Page Views - THREE")
	.prepare();

metricAveragePageViewsSeven
	.el(document.getElementById("metric-average-pages__seven"))
	.height(450)
	.title("Average Article Page Views - SEVEN")
	.prepare();

metricAveragePageViewsNine
	.el(document.getElementById("metric-average-pages__nine"))
	.height(450)
	.title("Average Article Page Views - NINE")
	.prepare();

metricAveragePageViewsControl
	.el(document.getElementById("metric-average-pages__control"))
	.height(450)
	.title("Average Article Page Views - FIVE (C)")
	.prepare();

metricSessionsThree
	.el(document.getElementById("metric-number-sessions__three"))
	.height(450)
	.title("Number Of Sessions - THREE")
	.prepare();

metricSessionsSeven
	.el(document.getElementById("metric-number-sessions__seven"))
	.height(450)
	.title("Number Of Sessions - SEVEN")
	.prepare();

metricSessionsNine
	.el(document.getElementById("metric-number-sessions__nine"))
	.height(450)
	.title("Number Of Sessions - NINE")
	.prepare();

metricSessionsControl
	.el(document.getElementById("metric-number-sessions__control"))
	.height(450)
	.title("Number Of Sessions - FIVE (C)")
	.prepare();

client.run(pageViewsBySessionQuery(), function(err, res) {
	if (err) {
		console.log('Err ', err) ;
	}

	const outliersSessionsArray = res && res.result.filter(session => session.result > 100)
					.map(session => session["ingest.device.spoor_session"]);

	const outliersSessionsFilter = [];

	outliersSessionsArray.forEach(function (session) {
		outliersSessionsFilter.push(
			{"operator":"ne",
			"property_name": "ingest.device.spoor_session",
			"property_value": session}
		);
	});

	client.run(articleDepthQuery(outliersSessionsFilter), function(err, res) {
		if (err) {
			console.log('Err ', err);
		}
	const transformedResult = distributionTransform(res);
	const resultsThree = transformedResult.find(res => res.condition === "three");
	const resultsSeven = transformedResult.find(res => res.condition === "seven");
	const resultsNine = transformedResult.find(res => res.condition === "nine");
	const resultsControl = transformedResult.find(res => res.condition === "control");

	metricMoreThanOneThree
		.data({result: resultsThree.moreThanOne})
		.chartType("metric")
		.render();

	metricMoreThanOneSeven
		.data({result: resultsSeven.moreThanOne})
		.chartType("metric")
		.render();

	metricMoreThanOneNine
		.data({result: resultsNine.moreThanOne})
		.chartType("metric")
		.render();

	metricMoreThanOneControl
		.data({result: resultsControl.moreThanOne})
		.chartType("metric")
		.render();

	metricAveragePageViewsThree
		.data({result: resultsThree.avgPageViews})
		.chartType("metric")
		.render();

	metricAveragePageViewsSeven
		.data({result: resultsSeven.avgPageViews})
		.chartType("metric")
		.render();

	metricAveragePageViewsNine
		.data({result: resultsNine.avgPageViews})
		.chartType("metric")
		.render();

	metricAveragePageViewsControl
		.data({result: resultsControl.avgPageViews})
		.chartType("metric")
		.render();

	metricSessionsThree
		.data({result: resultsThree.sessions})
		.chartType("metric")
		.render();

	metricSessionsSeven
		.data({result: resultsSeven.sessions})
		.chartType("metric")
		.render();

	metricSessionsNine
		.data({result: resultsNine.sessions})
		.chartType("metric")
		.render();

	metricSessionsControl
		.data({result: resultsControl.sessions})
		.chartType("metric")
		.render();

	});
});
