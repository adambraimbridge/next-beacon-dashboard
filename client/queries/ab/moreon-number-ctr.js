/* global Keen , keen_project, keen_read_key, $ */

'use strict';

const articleCTAs = require('../article/article-ctas');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const referrerParameter = queryParameters.referrerType;
const subComponents = ["more-on", "story-package"];
const timeFrame = {"end":"2016-03-31T00:00:00.000+00:00","start":"2016-02-11T00:00:00.000+00:00"};
const standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"ingest.context.is_inline",
	"property_value":false},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true},
	{"operator":"exists",
	"property_name":"ab.articleMoreOnNumber",
	"property_value":true},
	{"operator":"exists",
	"property_name":"ingest.device.spoor_session",
	"property_value":true}];
const searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"}];
const socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"}];
const domPathfilter = [
	{"operator":"in",
	"property_name":"meta.domPath",
	"property_value": metaDomPathArray(subComponents)}];
const client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

const metricCTRThree = new Keen.Dataviz();
const metricCTRSeven = new Keen.Dataviz();
const metricCTRNine = new Keen.Dataviz();
const metricCTRControl = new Keen.Dataviz();

let referrerFilters;
let chartHeadingModifier;


function filterBySubCompnents(subComponentTypes, category) {
	let resultArray = [];
	subComponentTypes.forEach(function(type) {
		articleCTAs.filter(function(cta) {
			return cta["subComponent"] === type;
		})
		.map(function (filteredCTA) {
			resultArray.push(filteredCTA[category]);
		});
	});
	return resultArray;
}

function getUnique(nonUniqueArray) {
	let uniqueArray = [];
	nonUniqueArray.forEach(function(nonUnique) {
		if (uniqueArray.indexOf(nonUnique) === -1) {
			uniqueArray.push(nonUnique);
		}
	});
	return uniqueArray;
}

function metaDomPathArray(subComponentTypes) {
	return filterBySubCompnents(subComponentTypes, "domPath");
}

function targetArray(subComponentTypes) {
	return getUnique(filterBySubCompnents(subComponentTypes, "target"));
}

function pageViewsBySessionQuery() {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referrerFilters)
			.concat(standardQueryFilters),
		groupBy: "ingest.device.spoor_session",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function ctaQuery(subComponents, outliersSessionsFilter) {
	let parameters = {
		eventCollection: "cta",
		filters: []
			.concat(outliersSessionsFilter)
			.concat(referrerFilters)
			.concat(domPathfilter)
			.concat(standardQueryFilters),
		groupBy: ["meta.domPath","ab.articleMoreOnNumber"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function baseQuery(outliersSessionsFilter) {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referrerFilters)
			.concat(outliersSessionsFilter)
			.concat(standardQueryFilters),
		groupBy: "ab.articleMoreOnNumber",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function runQuery(types) {

	client.run(pageViewsBySessionQuery(), function (err, res) {
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

		client.run([ctaQuery(types, outliersSessionsFilter), baseQuery(outliersSessionsFilter)], function(err, res) {
			if (err) {
				console.log('err ', err);
			}
			else {

				let baseResults = res[1];
				let clickResults = res[0];

				let newBaseResults = [
					{"ab.articleMoreOnNumber":"three",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"seven",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"nine",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"control",
					pageViews: 0}
				];

				newBaseResults.map(function(newBaseResult) {
					baseResults.result.map(function(baseResult) {
						if (newBaseResult["ab.articleMoreOnTopicCard"] === baseResult["ab.articleMoreOnTopicCard"]) {
							newBaseResult.pageViews += baseResult.result;
						}
					});
				});

				let newClickResults = [];

				metaDomPathArray(subComponents).map(function(path) {
					let newClickResult = {
						domPath: path,
						target: articleCTAs.find(cta => cta.domPath === path)["target"],
						three: 0,
						seven: 0,
						nine: 0,
						control: 0
					};
					newClickResults.push(newClickResult);
				});

				clickResults.result.map(function(clickResult) {
					let matchedDomPath = newClickResults.filter(function(newClickResult) {
						return clickResult["meta.domPath"] === newClickResult.domPath;
					})[0];
					if (clickResult["ab.articleMoreOnNumber"] === "three") {
						matchedDomPath.three += clickResult.result;
					}
					if (clickResult["ab.articleMoreOnNumber"] === "seven") {
						matchedDomPath.seven += clickResult.result;
					}
					if (clickResult["ab.articleMoreOnNumber"] === "nine") {
						matchedDomPath.nine += clickResult.result;
					}
					if (clickResult["ab.articleMoreOnTopicCard"] === "control") {
						matchedDomPath.control += clickResult.result;
					}
				});

				newClickResults = newClickResults
					.filter(res => res.three > 0 || res.seven > 0 || res.nine > 0 || res.control > 0);

				//turn clicks into ctr

				newClickResults.map(function (newClickResult) {
					newBaseResults.forEach(function (newBaseResult) {
						if (newBaseResult["ab.articleMoreOnNumber"] === "three") {
							newClickResult.threeCtr = parseFloat((newClickResult.three * 100) / newBaseResult.pageViews);
						}
						if (newBaseResult["ab.articleMoreOnNumber"] === "seven") {
							newClickResult.sevenCtr = parseFloat((newClickResult.seven * 100) / newBaseResult.pageViews);
						}
						if (newBaseResult["ab.articleMoreOnNumber"] === "nine") {
							newClickResult.nineCtr = parseFloat((newClickResult.nine * 100) / newBaseResult.pageViews);
						}
						if (newBaseResult["ab.articleMoreOnNumber"] === "control") {
							newClickResult.controlCtr = parseFloat((newClickResult.control * 100) / newBaseResult.pageViews);
						}
					});
				});

				// sum the results at top level

				let totalResult = {
					three: 0,
					threeCtr: 0,
					seven: 0,
					sevenCtr: 0,
					nine: 0,
					nineCtr: 0,
					control: 0,
					controlCtr: 0
				};

				newClickResults.map(function (newClickResult) {
					totalResult.three += newClickResult.three;
					totalResult.threeCtr += newClickResult.threeCtr;
					totalResult.seven += newClickResult.seven;
					totalResult.sevenCtr += newClickResult.sevenCtr;
					totalResult.nine += newClickResult.nine;
					totalResult.nineCtr += newClickResult.nineCtr;
					totalResult.control += newClickResult.control;
					totalResult.controlCtr += newClickResult.controlCtr;
				});

				metricCTRThree
					.data({result: totalResult.threeCtr})
					.chartType("metric")
					.render();

				metricCTRSeven
					.data({result: totalResult.sevenCtr})
					.chartType("metric")
					.render();

				metricCTRNine
					.data({result: totalResult.nineCtr})
					.chartType("metric")
					.render();

				metricCTRControl
					.data({result: totalResult.controlCtr})
					.chartType("metric")
					.render();

				// sum the results up by target

				let clickResultsTarget = [];

				targetArray(subComponents).map(function (target) {
					let targetResult = {
						target: target,
						three: 0,
						threeCtr: 0,
						seven: 0,
						sevenCtr: 0,
						nine: 0,
						nineCtr: 0,
						control: 0,
						controlCtr: 0
					};
					clickResultsTarget.push(targetResult);
				});

				newClickResults.map(function (newClickResult) {
					clickResultsTarget.map(function (target) {
						if (target.target === newClickResult.target) {
							target.three += newClickResult.three;
							target.threeCtr += newClickResult.threeCtr;
							target.seven += newClickResult.seven;
							target.sevenCtr += newClickResult.sevenCtr;
							target.nine += newClickResult.nine;
							target.nineCtr += newClickResult.nineCtr;
							target.control += newClickResult.control;
							target.controlCtr += newClickResult.controlCtr;
						}
					});
				});

				clickResultsTarget = clickResultsTarget
					.filter(res => res.three > 0 || res.seven > 0 || res.nine > 0 || res.control > 0);

				//draw the table - by target
				let tableTarget = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				let tr = $('<tr>')
					.append($('<th>').text('CTR% by target ' + chartHeadingModifier).attr("colspan",9));

				tr.appendTo(tableTarget);

				tr = $('<tr>')
					.append($('<th>').text('Target'))
					.append($('<th>').text('THREE Clicks'))
					.append($('<th>').text('THREE CTR'))
					.append($('<th>').text('FIVE (C) Clicks'))
					.append($('<th>').text('FIVE (C) CTR'));
					.append($('<th>').text('SEVEN Clicks'))
					.append($('<th>').text('SEVEN CTR'))
					.append($('<th>').text('NINE Clicks'))
					.append($('<th>').text('NINE CTR'))

				tr.appendTo(tableTarget);

				clickResultsTarget.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.three))
						.append($('<td>').text(row.threeCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)));
						.append($('<td>').text(row.seven))
						.append($('<td>').text(row.sevenCtr.toFixed(2)))
						.append($('<td>').text(row.nine))
						.append($('<td>').text(row.nineCtr.toFixed(2)))

					tr.appendTo(tableTarget);
				});

				let el = document.getElementById("table-target");
				tableTarget.appendTo($(el));

				// table by domPath

				let tableDomPath = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				tr = $('<tr>')
					.append($('<th>').text('CTR% by domPath ' + chartHeadingModifier).attr("colspan",10));

				tr.appendTo(tableDomPath);

				tr = $('<tr>')
					.append($('<th>').text('domPath'))
					.append($('<th>').text('Target'))
					.append($('<th>').text('THREE Clicks'))
					.append($('<th>').text('THREE CTR'))
					.append($('<th>').text('FIVE (C) Clicks'))
					.append($('<th>').text('FIVE (C) CTR'));
					.append($('<th>').text('SEVEN Clicks'))
					.append($('<th>').text('SEVEN CTR'))
					.append($('<th>').text('NINE Clicks'))
					.append($('<th>').text('NINE CTR'))

				tr.appendTo(tableDomPath);

				newClickResults.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.domPath))
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.three))
						.append($('<td>').text(row.threeCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)));
						.append($('<td>').text(row.seven))
						.append($('<td>').text(row.sevenCtr.toFixed(2)))
						.append($('<td>').text(row.nine))
						.append($('<td>').text(row.nineCtr.toFixed(2)))

					tr.appendTo(tableDomPath);
				});

				el = document.getElementById("table-dom-path");
				tableDomPath.appendTo($(el));

			}
		});
	});
}

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

metricCTRThree
	.el(document.getElementById("metric-ctr__three"))
	.height(450)
	.title("% CTR - THREE")
	.prepare();

metricCTRSeven
	.el(document.getElementById("metric-ctr__seven"))
	.height(450)
	.title("% CTR - SEVEN")
	.prepare();

metricCTRNine
	.el(document.getElementById("metric-ctr__nine"))
	.height(450)
	.title("% CTR - NINE")
	.prepare();

metricCTRControl
	.el(document.getElementById("metric-ctr__control"))
	.height(450)
	.title("% CTR - FIVE (CONTROL)")
	.prepare();

runQuery(subComponents);
