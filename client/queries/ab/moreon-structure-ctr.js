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

const metricCTROn = new Keen.Dataviz();
const metricCTROff = new Keen.Dataviz();

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

function ctaQuery() {
	let parameters = {
		eventCollection: "cta",
		filters: []
			.concat(domPathfilter)
			.concat(referrerFilters)
			.concat(standardQueryFilters),
		groupBy: ["meta.domPath","ab.articleMoreOnTopicCard"],
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function baseQuery() {
	let parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referrerFilters)
			.concat(standardQueryFilters),
		groupBy: "ab.articleMoreOnTopicCard",
		timeframe: timeFrame,
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
}

function runQuery(types) {

	client.run([ctaQuery(types), baseQuery()], function(err, res) {
		if (err) {
			console.log('err ', err);
		}
		else {

			res.forEach(function(resItem) {
				resItem.result.map(function(el) {
					if (el["ab.articleMoreOnTopicCard"] === "control") {
						el["ab.articleMoreOnTopicCard"] = "off";
					}
					if (el["ab.articleMoreOnTopicCard"] === "variant") {
						el["ab.articleMoreOnTopicCard"] = "on";
					}
				});
			});

			let baseResults = res[1];
			let clickResults = res[0];

			let newBaseResults = [
				{"ab.articleMoreOnTopicCard":"on",
				pageViews: 0},
				{"ab.articleMoreOnTopicCard":"off",
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
					on: 0,
					off: 0
				};
				newClickResults.push(newClickResult);
			});

			clickResults.result.map(function(clickResult) {
				let matchedDomPath = newClickResults.filter(function(newClickResult) {
					return clickResult["meta.domPath"] === newClickResult.domPath;
				})[0];
				if (clickResult["ab.articleMoreOnTopicCard"] === "on") {
					matchedDomPath.on += clickResult.result;
				}
				if (clickResult["ab.articleMoreOnTopicCard"] === "off") {
					matchedDomPath.off += clickResult.result;
				}
			});

			newClickResults = newClickResults.filter(res => res.on > 0 || res.off > 0);

			//turn clicks into ctr

			newClickResults.map(function (newClickResult) {
				newBaseResults.forEach(function (newBaseResult) {
					if (newBaseResult["ab.articleMoreOnTopicCard"] === "on") {
						newClickResult.onCtr = parseFloat((newClickResult.on * 100) / newBaseResult.pageViews);
					}
					if (newBaseResult["ab.articleMoreOnTopicCard"] === "off") {
						newClickResult.offCtr = parseFloat((newClickResult.off * 100) / newBaseResult.pageViews);
					}
				});
			});

			// sum the results at top level

			let totalResult = {
				on: 0,
				onCtr: 0,
				off: 0,
				offCtr: 0
			};

			newClickResults.map(function (newClickResult) {
				totalResult.on += newClickResult.on;
				totalResult.onCtr += newClickResult.onCtr;
				totalResult.off += newClickResult.off;
				totalResult.offCtr += newClickResult.offCtr;
			});

			metricCTROn
				.data({result: totalResult.onCtr})
				.chartType("metric")
				.render();

			metricCTROff
				.data({result: totalResult.offCtr})
				.chartType("metric")
				.render();

			// sum the results up by target

			let clickResultsTarget = [];

			targetArray(subComponents).map(function (target) {
				let targetResult = {
					target: target,
					on: 0,
					onCtr: 0,
					off: 0,
					offCtr: 0
				};
				clickResultsTarget.push(targetResult);
			});

			newClickResults.map(function (newClickResult) {
				clickResultsTarget.map(function (target) {
					if (target.target === newClickResult.target) {
						target.on += newClickResult.on;
						target.onCtr += newClickResult.onCtr;
						target.off += newClickResult.off;
						target.offCtr += newClickResult.offCtr;
					}
				});
			});

			clickResultsTarget = clickResultsTarget.filter(res => res.on > 0 || res.off > 0);

			//draw the table - by target
			let tableTarget = $('<table>')
						.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

			let tr = $('<tr>')
				.append($('<th>').text('CTR% by target ' + chartHeadingModifier).attr("colspan",5));

			tr.appendTo(tableTarget);

			tr = $('<tr>')
				.append($('<th>').text('Target'))
				.append($('<th>').text('ON Clicks'))
				.append($('<th>').text('ON CTR'))
				.append($('<th>').text('OFF Clicks'))
				.append($('<th>').text('OFF CTR'));

			tr.appendTo(tableTarget);

			clickResultsTarget.forEach(function(row) {
				tr = $('<tr>')
					.append($('<td>').text(row.target))
					.append($('<td>').text(row.on))
					.append($('<td>').text(row.onCtr.toFixed(2)))
					.append($('<td>').text(row.off))
					.append($('<td>').text(row.offCtr.toFixed(2)));

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
				.append($('<th>').text('ON Clicks'))
				.append($('<th>').text('ON CTR'))
				.append($('<th>').text('OFF Clicks'))
				.append($('<th>').text('OFF CTR'));

			tr.appendTo(tableDomPath);

			newClickResults.forEach(function(row) {
				tr = $('<tr>')
					.append($('<td>').text(row.domPath))
					.append($('<td>').text(row.target))
					.append($('<td>').text(row.on))
					.append($('<td>').text(row.onCtr.toFixed(2)))
					.append($('<td>').text(row.off))
					.append($('<td>').text(row.offCtr.toFixed(2)));

				tr.appendTo(tableDomPath);
			});

			el = document.getElementById("table-dom-path");
			tableDomPath.appendTo($(el));

		}
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

metricCTROn
	.el(document.getElementById("metric-ctr__on"))
	.height(450)
	.title("% CTR - ON")
	.prepare();

metricCTROff
	.el(document.getElementById("metric-ctr__off"))
	.height(450)
	.title("% CTR - OFF")
	.prepare();

runQuery(subComponents);
