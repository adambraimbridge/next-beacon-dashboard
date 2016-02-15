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
	"property_name":"content.features.hasStoryPackage",
	"property_value":true},
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

const metricCTRThreeStoryPackage = new Keen.Dataviz();
const metricCTRSevenStoryPackage = new Keen.Dataviz();
const metricCTRNineStoryPackage = new Keen.Dataviz();
const metricCTRControlStoryPackage = new Keen.Dataviz();

const metricCTRThreeNoStoryPackage = new Keen.Dataviz();
const metricCTRSevenNoStoryPackage = new Keen.Dataviz();
const metricCTRNineNoStoryPackage = new Keen.Dataviz();
const metricCTRControlNoStoryPackage = new Keen.Dataviz();

let referrerFilters;
let chartHeadingModifier;
let clickResults;
let baseResults;

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

function ctrByVariant(variant, storyPackage) {
	let ctrArray = clickResults
		.filter(res => res["ab.articleMoreOnNumber"] === variant);
	if (storyPackage === "yes") {
		ctrArray = ctrArray.filter(res => res["content.features.hasStoryPackage"] === true)
	}
	if (storyPackage === "no") {
		ctrArray = ctrArray.filter(res => res["content.features.hasStoryPackage"] === false)
	}
	const ctrType = storyPackage === 'all' ? "ctrHighLevel" : "ctrSpecific";
	return ctrArray
		.map(res => res[ctrType])
		.reduce((carry, item) => carry + item);
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
		maxAge:1800
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
		groupBy: ["meta.domPath","ab.articleMoreOnNumber", "content.features.hasStoryPackage"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:1800
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
		groupBy: ["ab.articleMoreOnNumber", "content.features.hasStoryPackage"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:1800
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

				baseResults = res[1].result;
				clickResults = res[0].result;

				baseResults.forEach(baseResult => {
					const hasStoryPackage = baseResult["content.features.hasStoryPackage"];
					switch (baseResult["ab.articleMoreOnNumber"]) {
						case "three":
							baseResult.totalLinks = hasStoryPackage ? 11 : 6;
							break;
						case "seven":
							baseResult.totalLinks = hasStoryPackage ? 19 : 14;
							break;
						case "nine":
							baseResult.totalLinks = hasStoryPackage ? 23 : 18;
							break;
						case "control":
							baseResult.totalLinks = hasStoryPackage ? 15 : 10;
							break;
						default:
							baseResult.totalLinks = false;
					}
				});

				clickResults.forEach(clickResult => {
					let domPathArray = clickResult["meta.domPath"].split('|');
					domPathArray.forEach(item => item.trim());
					let linksPerPod;
					switch (clickResult["ab.articleMoreOnNumber"]) {
						case "three":
						linksPerPod = 3;
						break;
						case "seven":
						linksPerPod = 7;
						break;
						case "nine":
						linksPerPod = 9;
						break;
						default:
						linksPerPod = 5;
					}
					const hasStoryPackage = clickResult["content.features.hasStoryPackage"];
					const domPathArrayElOne = domPathArray[0].split('-');
					const domPathArrayElTwo = domPathArray[1].split('-');
					let parentIndex = 0;
					if (domPathArrayElOne[0] === 'more') {
						parentIndex += parseInt(domPathArrayElOne[2]);
						if (hasStoryPackage) {
							parentIndex ++;
						}
					}
					const moreOnTotalLinks = 2 * linksPerPod;
					const storyPackageLinks = hasStoryPackage ? 5 : 0;
					if (domPathArray.length === 3 && domPathArray[2].indexOf('article') > -1) {
						const podIndex = parseInt(domPathArrayElTwo[1]);
						let linkIndex;
						switch (parentIndex) {
							case 0:
							linkIndex = podIndex;
							break;
							case 1:
							linkIndex = hasStoryPackage ? 5 + podIndex: linksPerPod + podIndex;
							break;
							case 2:
							linkIndex = 5 + linksPerPod + podIndex;
							break;
							default:
							linkIndex = false;
						}
						clickResult.linkIndex = linkIndex + 1;
					}
					clickResult.totalLinks = storyPackageLinks + moreOnTotalLinks;
					clickResult.ctrSpecific = parseFloat(
						(clickResult.result * 100) / baseResults.find(res => res.totalLinks === (storyPackageLinks + moreOnTotalLinks)).result
					);
					let highLevelPageViews = baseResults
						.filter(res => res["ab.articleMoreOnNumber"] === clickResult["ab.articleMoreOnNumber"])
						.map(res => res.result)
						.reduce((carry, item) => carry + item);
					clickResult.ctrHighLevel = parseFloat((clickResult.result * 100) / highLevelPageViews);
				});

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

				let newBaseResultsStoryPackage = [
					{"ab.articleMoreOnNumber":"three",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"seven",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"nine",
					pageViews: 0},
					{"ab.articleMoreOnNumber":"control",
					pageViews: 0}
				];

				let newBaseResultsNoStoryPackage = [
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
					baseResults.map(function(baseResult) {
						if (newBaseResult["ab.articleMoreOnNumber"] === baseResult["ab.articleMoreOnNumber"]) {
							newBaseResult.pageViews += baseResult.result;
						}
					});
				});

				newBaseResultsStoryPackage.map(function(newBaseResult) {
					baseResults.map(function(baseResult) {
						if (newBaseResult["ab.articleMoreOnNumber"] === baseResult["ab.articleMoreOnNumber"]
								&& baseResult["content.features.hasStoryPackage"] === true) {
							newBaseResult.pageViews += baseResult.result;
						}
					});
				});

				newBaseResultsNoStoryPackage.map(function(newBaseResult) {
					baseResults.map(function(baseResult) {
						if (newBaseResult["ab.articleMoreOnNumber"] === baseResult["ab.articleMoreOnNumber"]
								&& baseResult["content.features.hasStoryPackage"] === false) {
							newBaseResult.pageViews += baseResult.result;
						}
					});
				});

				let newClickResults = [];
				let newClickResultsStoryPackage = [];
				let newClickResultsNoStoryPackage = [];

				metaDomPathArray(subComponents).map(function(path) {
					const target = articleCTAs.find(cta => cta.domPath === path)["target"];

					let newClickResult = {
						domPath: path,
						target: target,
						linkIndex: 0,
						three: 0,
						seven: 0,
						nine: 0,
						control: 0
					};
					newClickResults.push(newClickResult);

					let newClickResultStoryPackage = {
						domPath: path,
						target: target,
						linkIndex: 0,
						three: 0,
						seven: 0,
						nine: 0,
						control: 0
					};
					newClickResultsStoryPackage.push(newClickResultStoryPackage);

					let newClickResultNoStoryPackage = {
						domPath: path,
						target: target,
						linkIndex: 0,
						three: 0,
						seven: 0,
						nine: 0,
						control: 0
					};
					newClickResultsNoStoryPackage.push(newClickResultNoStoryPackage);
				});

				clickResults.map(function(clickResult) {
					let matchedDomPath = newClickResults.filter(function(newClickResult) {
						return clickResult["meta.domPath"] === newClickResult.domPath;
					})[0];
					let matchedDomPathStoryPackage = newClickResultsStoryPackage.filter(function(newClickResult) {
						return clickResult["meta.domPath"] === newClickResult.domPath;
					})[0];
					let matchedDomPathNoStoryPackage = newClickResultsNoStoryPackage.filter(function(newClickResult) {
						return clickResult["meta.domPath"] === newClickResult.domPath;
					})[0];
					if (clickResult["ab.articleMoreOnNumber"] === "three") {
						matchedDomPath.three += clickResult.result;
						if (clickResult["content.features.hasStoryPackage"] === true) {
							matchedDomPathStoryPackage.three += clickResult.result;
						} else {
							matchedDomPathNoStoryPackage.three += clickResult.result;
						}
					}
					if (clickResult["ab.articleMoreOnNumber"] === "seven") {
						matchedDomPath.seven += clickResult.result;
						if (clickResult["content.features.hasStoryPackage"] === true) {
							matchedDomPathStoryPackage.seven += clickResult.result;
						} else {
							matchedDomPathNoStoryPackage.seven += clickResult.result;
						}
					}
					if (clickResult["ab.articleMoreOnNumber"] === "nine") {
						matchedDomPath.nine += clickResult.result;
						if (clickResult["content.features.hasStoryPackage"] === true) {
							matchedDomPathStoryPackage.nine += clickResult.result;
						} else {
							matchedDomPathNoStoryPackage.nine += clickResult.result;
						}
					}
					if (clickResult["ab.articleMoreOnNumber"] === "control") {
						matchedDomPath.control += clickResult.result;
						if (clickResult["content.features.hasStoryPackage"] === true) {
							matchedDomPathStoryPackage.control += clickResult.result;
						} else {
							matchedDomPathNoStoryPackage.control += clickResult.result;
						}
					}
				});

				newClickResults = newClickResults
					.filter(res => res.three > 0 || res.seven > 0 || res.nine > 0 || res.control > 0);

				newClickResultsStoryPackage = newClickResultsStoryPackage
					.filter(res => res.three > 0 || res.seven > 0 || res.nine > 0 || res.control > 0);

				newClickResultsNoStoryPackage = newClickResultsNoStoryPackage
					.filter(res => res.three > 0 || res.seven > 0 || res.nine > 0 || res.control > 0);

				//turn clicks into ctr

				// With and without Story Package Total

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

				// With Story Package

				newClickResultsStoryPackage.map(function (newClickResult) {
					newBaseResultsStoryPackage.forEach(function (newBaseResult) {
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

				let totalResultStoryPackage = {
					three: 0,
					threeCtr: 0,
					seven: 0,
					sevenCtr: 0,
					nine: 0,
					nineCtr: 0,
					control: 0,
					controlCtr: 0
				};

				newClickResultsStoryPackage.map(function (newClickResult) {
					totalResultStoryPackage.three += newClickResult.three;
					totalResultStoryPackage.threeCtr += newClickResult.threeCtr;
					totalResultStoryPackage.seven += newClickResult.seven;
					totalResultStoryPackage.sevenCtr += newClickResult.sevenCtr;
					totalResultStoryPackage.nine += newClickResult.nine;
					totalResultStoryPackage.nineCtr += newClickResult.nineCtr;
					totalResultStoryPackage.control += newClickResult.control;
					totalResultStoryPackage.controlCtr += newClickResult.controlCtr;
				});

				// Without Story Package

				newClickResultsNoStoryPackage.map(function (newClickResult) {
					newBaseResultsNoStoryPackage.forEach(function (newBaseResult) {
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

				let totalResultNoStoryPackage = {
					three: 0,
					threeCtr: 0,
					seven: 0,
					sevenCtr: 0,
					nine: 0,
					nineCtr: 0,
					control: 0,
					controlCtr: 0
				};

				newClickResultsNoStoryPackage.map(function (newClickResult) {
					totalResultNoStoryPackage.three += newClickResult.three;
					totalResultNoStoryPackage.threeCtr += newClickResult.threeCtr;
					totalResultNoStoryPackage.seven += newClickResult.seven;
					totalResultNoStoryPackage.sevenCtr += newClickResult.sevenCtr;
					totalResultNoStoryPackage.nine += newClickResult.nine;
					totalResultNoStoryPackage.nineCtr += newClickResult.nineCtr;
					totalResultNoStoryPackage.control += newClickResult.control;
					totalResultNoStoryPackage.controlCtr += newClickResult.controlCtr;
				});



				metricCTRThree
					.data({result: ctrByVariant("three", "all")})
					.chartType("metric")
					.render();

				metricCTRSeven
					.data({result: ctrByVariant("seven", "all")})
					.chartType("metric")
					.render();

				metricCTRNine
					.data({result: ctrByVariant("nine", "all")})
					.chartType("metric")
					.render();

				metricCTRControl
					.data({result: ctrByVariant("control", "all")})
					.chartType("metric")
					.render();

				metricCTRThreeStoryPackage
					.data({result: ctrByVariant("three", "yes")})
					.chartType("metric")
					.render();

				metricCTRSevenStoryPackage
					.data({result: ctrByVariant("seven", "yes")})
					.chartType("metric")
					.render();

				metricCTRNineStoryPackage
					.data({result: ctrByVariant("nine", "yes")})
					.chartType("metric")
					.render();

				metricCTRControlStoryPackage
					.data({result: ctrByVariant("control", "yes")})
					.chartType("metric")
					.render();

				metricCTRThreeNoStoryPackage
					.data({result: ctrByVariant("three", "no")})
					.chartType("metric")
					.render();

				metricCTRSevenNoStoryPackage
					.data({result: ctrByVariant("seven", "no")})
					.chartType("metric")
					.render();

				metricCTRNineNoStoryPackage
					.data({result: ctrByVariant("nine", "no")})
					.chartType("metric")
					.render();

				metricCTRControlNoStoryPackage
					.data({result: ctrByVariant("control", "no")})
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
					.append($('<th>').text('FIVE (C) CTR'))
					.append($('<th>').text('SEVEN Clicks'))
					.append($('<th>').text('SEVEN CTR'))
					.append($('<th>').text('NINE Clicks'))
					.append($('<th>').text('NINE CTR'));

				tr.appendTo(tableTarget);

				clickResultsTarget.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.three))
						.append($('<td>').text(row.threeCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)))
						.append($('<td>').text(row.seven))
						.append($('<td>').text(row.sevenCtr.toFixed(2)))
						.append($('<td>').text(row.nine))
						.append($('<td>').text(row.nineCtr.toFixed(2)));

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
					.append($('<th>').text('FIVE (C) CTR'))
					.append($('<th>').text('SEVEN Clicks'))
					.append($('<th>').text('SEVEN CTR'))
					.append($('<th>').text('NINE Clicks'))
					.append($('<th>').text('NINE CTR'));

				tr.appendTo(tableDomPath);

				newClickResults.forEach(function(row) {
					tr = $('<tr>')
						.append($('<td>').text(row.domPath))
						.append($('<td>').text(row.target))
						.append($('<td>').text(row.three))
						.append($('<td>').text(row.threeCtr.toFixed(2)))
						.append($('<td>').text(row.control))
						.append($('<td>').text(row.controlCtr.toFixed(2)))
						.append($('<td>').text(row.seven))
						.append($('<td>').text(row.sevenCtr.toFixed(2)))
						.append($('<td>').text(row.nine))
						.append($('<td>').text(row.nineCtr.toFixed(2)));

					tr.appendTo(tableDomPath);
				});

				el = document.getElementById("table-dom-path");
				tableDomPath.appendTo($(el));

				// Click Rate By Link Index and Total Links

				let clickResultsLinkIndex;

				clickResultsLinkIndex = clickResults
					.filter(res => res.linkIndex);

				const uniqueLinkIndices = [];
				clickResultsLinkIndex
					.map(res => res.linkIndex)
					.forEach(res => {
						if (uniqueLinkIndices.indexOf(res) === -1) {
							uniqueLinkIndices.push(res);
						}
					});
				uniqueLinkIndices.sort((a,b) => a-b);

				const uniqueTotalLinks = [];
				clickResultsLinkIndex
					.map(res => res.totalLinks)
					.forEach(res => {
						if (uniqueTotalLinks.indexOf(res) === -1) {
							uniqueTotalLinks.push(res);
						}
					});
				uniqueTotalLinks.sort((a,b) => a-b);

				let tableLinkIndex = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				tr = $('<tr>')
					.append($('<th>').text('CTR% by Link Index ' + chartHeadingModifier).attr("colspan",9));

				tr.appendTo(tableDomPath);

				tr = $('<tr>')
					.append($('<th>').text('Link Index'));

				uniqueTotalLinks.forEach(item => {
					tr.append($('<th>').text(`${item} Links`))
				});

				tr.appendTo(tableLinkIndex);

				uniqueLinkIndices.forEach(link => {
					tr = $('<tr>')
						.append($('<td>').text(link));

					uniqueTotalLinks.forEach(total => {
						let ctr;
						const ctrArray = clickResultsLinkIndex
							.filter(res => res.linkIndex === link && res.totalLinks === total);
						if (ctrArray.length > 0) {
							ctr = ctrArray
								.map(res => res.ctrSpecific)
								.reduce((carry, item) => carry + item);
						} else {
							ctr = 0;
						}
						tr.append($('<td>').text(ctr.toFixed(2)));
					})

					tr.appendTo(tableLinkIndex);
				});

				tr = $('<tr>').append($('<td>').text('Total CTR%'));

				uniqueTotalLinks.forEach(total => {
					const ctr = clickResultsLinkIndex
						.filter(res => res.totalLinks === total)
						.map(res => res.ctrSpecific)
						.reduce((carry, item) => carry + item);
					tr.append($('<td>').text(ctr.toFixed(2)));
				});

				tr.appendTo(tableLinkIndex);

				el = document.getElementById("table-link-index");
				tableLinkIndex.appendTo($(el));


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

metricCTRThreeStoryPackage
	.el(document.getElementById("metric-ctr__three--sp"))
	.height(450)
	.title("% CTR - THREE")
	.prepare();

metricCTRSevenStoryPackage
	.el(document.getElementById("metric-ctr__seven--sp"))
	.height(450)
	.title("% CTR - SEVEN")
	.prepare();

metricCTRNineStoryPackage
	.el(document.getElementById("metric-ctr__nine--sp"))
	.height(450)
	.title("% CTR - NINE")
	.prepare();

metricCTRControlStoryPackage
	.el(document.getElementById("metric-ctr__control--sp"))
	.height(450)
	.title("% CTR - FIVE (CONTROL)")
	.prepare();

metricCTRThreeNoStoryPackage
	.el(document.getElementById("metric-ctr__three--no-sp"))
	.height(450)
	.title("% CTR - THREE")
	.prepare();

metricCTRSevenNoStoryPackage
	.el(document.getElementById("metric-ctr__seven--no-sp"))
	.height(450)
	.title("% CTR - SEVEN")
	.prepare();

metricCTRNineNoStoryPackage
	.el(document.getElementById("metric-ctr__nine--no-sp"))
	.height(450)
	.title("% CTR - NINE")
	.prepare();

metricCTRControlNoStoryPackage
	.el(document.getElementById("metric-ctr__control--no-sp"))
	.height(450)
	.title("% CTR - FIVE (CONTROL)")
	.prepare();

runQuery(subComponents);
