/* global Keen , keen_project, keen_read_key, $ */

'use strict';

const articleCTAs = require('../article/article-ctas');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const referrerParameter = queryParameters.referrerType;
const subComponents = ["more-on"];
const timeFrame = {"end":"2016-01-31T00:00:00.000+00:00","start":"2016-01-04T00:00:00.000+00:00"};
const standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true},
	{"operator":"exists",
	"property_name":"ab.articleMoreOnTopicCard",
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

const metricCTRVariant = new Keen.Dataviz();
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
		groupBy: ["meta.domPath","ab.articleMoreOnTopicCard"],
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
		groupBy: "ab.articleMoreOnTopicCard",
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
					{"ab.articleMoreOnTopicCard":"variant",
					pageViews: 0},
					{"ab.articleMoreOnTopicCard":"control",
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
						variant: 0,
						control: 0
					};
					newClickResults.push(newClickResult);
				});

				clickResults.result.map(function(clickResult) {
					let matchedDomPath = newClickResults.filter(function(newClickResult) {
						return clickResult["meta.domPath"] === newClickResult.domPath;
					})[0];
					if (clickResult["ab.articleMoreOnTopicCard"] === "variant") {
						matchedDomPath.variant += clickResult.result;
					}
					if (clickResult["ab.articleMoreOnTopicCard"] === "control") {
						matchedDomPath.control += clickResult.result;
					}
				});

				newClickResults = newClickResults.filter(res => res.variant > 0 || res.control > 0);

				//turn clicks into ctr

				newClickResults.map(function (newClickResult) {
					newBaseResults.forEach(function (newBaseResult) {
						if (newBaseResult["ab.articleMoreOnTopicCard"] === "variant") {
							newClickResult.variantCtr = parseFloat((newClickResult.variant * 100) / newBaseResult.pageViews);
						}
						if (newBaseResult["ab.articleMoreOnTopicCard"] === "control") {
							newClickResult.controlCtr = parseFloat((newClickResult.control * 100) / newBaseResult.pageViews);
						}
					});
				});

				// sum the results at top level

				let totalResult = {
					variant: 0,
					variantCtr: 0,
					control: 0,
					controlCtr: 0
				};

				newClickResults.map(function (newClickResult) {
					totalResult.variant += newClickResult.variant;
					totalResult.variantCtr += newClickResult.variantCtr;
					totalResult.control += newClickResult.control;
					totalResult.controlCtr += newClickResult.controlCtr;
				});

				metricCTRVariant
					.data({result: totalResult.variantCtr})
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
						variant: 0,
						variantCtr: 0,
						control: 0,
						controlCtr: 0
					};
					clickResultsTarget.push(targetResult);
				});

				newClickResults.map(function (newClickResult) {
					clickResultsTarget.map(function (target) {
						if (target.target === newClickResult.target) {
							target.variant += newClickResult.variant;
							target.variantCtr += newClickResult.variantCtr;
							target.control += newClickResult.control;
							target.controlCtr += newClickResult.controlCtr;
						}
					});
				});

				clickResultsTarget = clickResultsTarget.filter(res => res.variant > 0 || res.control > 0);

				//draw the table - by target
				let tableTarget = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				let tr = $('<tr>')
					.append($('<th>').text('CTR% by target ' + chartHeadingModifier).attr("colspan",5));

				tr.appendTo(tableTarget);

				tr = $('<tr>')
					.append($('<th>').text('Target'))
					.append($('<th>').text('VARIANT Clicks'))
					.append($('<th>').text('VARIANT CTR'))
					.append($('<th>').text('CONTROL Clicks'))
					.append($('<th>').text('CONTROL CTR'));

				tr.appendTo(tableTarget);

				clickResultsTarget.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.variant))
						.append($('<td>').text(row.variantCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)));

					tr.appendTo(tableTarget);
				});

				let el = document.getElementById("table-target");
				tableTarget.appendTo($(el));

				// table by domPath

				let tableDomPath = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				tr = $('<tr>')
					.append($('<th>').text('CTR% by domPath ' + chartHeadingModifier).attr("colspan",6));

				tr.appendTo(tableDomPath);

				tr = $('<tr>')
					.append($('<th>').text('domPath'))
					.append($('<th>').text('Target'))
					.append($('<th>').text('VARIANT Clicks'))
					.append($('<th>').text('VARIANT CTR'))
					.append($('<th>').text('CONTROL Clicks'))
					.append($('<th>').text('CONTROL CTR'));

				tr.appendTo(tableDomPath);

				newClickResults.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.domPath))
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.variant))
						.append($('<td>').text(row.variantCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)));

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

metricCTRVariant
	.el(document.getElementById("metric-ctr__variant"))
	.height(450)
	.title("% CTR - VARIANT")
	.prepare();

metricCTRControl
	.el(document.getElementById("metric-ctr__control"))
	.height(450)
	.title("% CTR - CONTROL")
	.prepare();

runQuery(subComponents);
