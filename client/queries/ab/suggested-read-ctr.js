/* global Keen , keen_project, keen_read_key, $ */

'use strict';

const articleCTAs = require('../article/article-ctas');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const referrerParameter = queryParameters.referrerType;
const targets = ["article", "stream", "homepage", "follow"];
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
	"property_value": metaDomPathArray(targets)}];
const client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

let referrerFilters;
let chartHeadingModifier;

function filterByTargets(targetTypes, category) {
	let resultArray = [];
	targetTypes.forEach(function(type) {
		articleCTAs.filter(function(cta) {
			return cta["target"] === type;
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

function metaDomPathArray(targetTypes) {
	return filterByTargets(targetTypes, "domPath");
}

function componentArray(targetTypes) {
	return getUnique(filterByTargets(targetTypes, "component"));
}

function subComponentArray(targetTypes) {
	return getUnique(filterByTargets(targetTypes, "subComponent"));
}

function ctaQuery() {
	let parameters = {
		eventCollection: "cta",
		filters: []
			.concat(domPathfilter)
			.concat(referrerFilters)
			.concat(standardQueryFilters),
		groupBy: ["meta.domPath","ab.articleSuggestedRead"],
		timeframe: {"end":"2015-12-02T00:00:00.000+00:00","start":"2015-10-29T00:00:00.000+00:00"},
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
		groupBy: "ab.articleSuggestedRead",
		timeframe: {"end":"2015-12-02T00:00:00.000+00:00","start":"2015-10-29T00:00:00.000+00:00"},
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
					if (el["ab.articleSuggestedRead"] === "control") {
						el["ab.articleSuggestedRead"] = "off";
					}
					if (el["ab.articleSuggestedRead"] === "variant") {
						el["ab.articleSuggestedRead"] = "on";
					}
				});
			});

			let baseResults = res[1];
			let clickResults = res[0];

			let newBaseResults = [
				{"ab.articleSuggestedRead":"on",
				pageViews: 0},
				{"ab.articleSuggestedRead":"off",
				pageViews: 0}
			];

			newBaseResults.map(function(newBaseResult) {
				baseResults.result.map(function(baseResult) {
					if (newBaseResult["ab.articleSuggestedRead"] === baseResult["ab.articleSuggestedRead"]) {
						newBaseResult.pageViews += baseResult.result;
					}
				});
			});

			let newClickResults = [];

			metaDomPathArray(targets).map(function(path) {
				let newClickResult = {
					domPath: path,
					component: articleCTAs.find(cta => cta.domPath === path)["component"],
					subComponent: articleCTAs.find(cta => cta.domPath === path)["subComponent"],
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
				if (clickResult["ab.articleSuggestedRead"] === "on") {
					matchedDomPath.on += clickResult.result;
				}
				if (clickResult["ab.articleSuggestedRead"] === "off") {
					matchedDomPath.off += clickResult.result;
				}
			});

			//turn clicks into ctr

			newClickResults.map(function (newClickResult) {
				newBaseResults.forEach(function (newBaseResult) {
					if (newBaseResult["ab.articleSuggestedRead"] === "on") {
						newClickResult.onCtr = parseFloat((newClickResult.on * 100) / newBaseResult.pageViews);
					}
					if (newBaseResult["ab.articleSuggestedRead"] === "off") {
						newClickResult.offCtr = parseFloat((newClickResult.off * 100) / newBaseResult.pageViews);
					}
				});
			});

			// sum the results up by subComponent

			let clickResultsSubComponent = [];

			subComponentArray(targets).map(function (subComponent) {
				let subComponentResult = {
					subComponent: subComponent,
					on: 0,
					onCtr: 0,
					off: 0,
					offCtr: 0
				};
				clickResultsSubComponent.push(subComponentResult);
			});

			newClickResults.map(function (newClickResult) {
				clickResultsSubComponent.map(function (subComponent) {
					if (subComponent.subComponent === newClickResult.subComponent) {
						subComponent.on += newClickResult.on;
						subComponent.onCtr += newClickResult.onCtr;
						subComponent.off += newClickResult.off;
						subComponent.offCtr += newClickResult.offCtr;
					}
				});
			});

			// sum the results up by component

			let clickResultsComponent = [];

			componentArray(targets).map(function (component) {
				let componentResult = {
					component: component,
					on: 0,
					onCtr: 0,
					off: 0,
					offCtr: 0
				};
				clickResultsComponent.push(componentResult);
			});

			newClickResults.map(function (newClickResult) {
				clickResultsComponent.map(function (component) {
					if (component.component === newClickResult.component) {
						component.on += newClickResult.on;
						component.onCtr += newClickResult.onCtr;
						component.off += newClickResult.off;
						component.offCtr += newClickResult.offCtr;
					}
				});
			});

			// sum the results up by target

			let clickResultsTarget = [];

			targets.map(function (target) {
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

			//draw the table - by component
			let tableComponent = $('<table>')
						.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

			tr = $('<tr>')
				.append($('<th>').text('CTR% by component ' + chartHeadingModifier).attr("colspan",5));

			tr.appendTo(tableComponent);

			tr = $('<tr>')
				.append($('<th>').text('Component'))
				.append($('<th>').text('ON Clicks'))
				.append($('<th>').text('ON CTR'))
				.append($('<th>').text('OFF Clicks'))
				.append($('<th>').text('OFF CTR'));

			tr.appendTo(tableComponent);

			clickResultsComponent.forEach(function(row) {
				tr = $('<tr>')
					.append($('<td>').text(row.component))
					.append($('<td>').text(row.on))
					.append($('<td>').text(row.onCtr.toFixed(2)))
					.append($('<td>').text(row.off))
					.append($('<td>').text(row.offCtr.toFixed(2)));

				tr.appendTo(tableComponent);
			});

			el = document.getElementById("table-component");
			tableComponent.appendTo($(el));

			// table by sub component

			let tableSubComponent = $('<table>')
						.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

			tr = $('<tr>')
				.append($('<th>').text('CTR% by sub component ' + chartHeadingModifier).attr("colspan",5));

			tr.appendTo(tableSubComponent);

			tr = $('<tr>')
				.append($('<th>').text('Sub Component'))
				.append($('<th>').text('ON Clicks'))
				.append($('<th>').text('ON CTR'))
				.append($('<th>').text('OFF Clicks'))
				.append($('<th>').text('OFF CTR'));

			tr.appendTo(tableSubComponent);

			clickResultsSubComponent.forEach(function(row) {
				tr = $('<tr>')
					.append($('<td>').text(row.subComponent))
					.append($('<td>').text(row.on))
					.append($('<td>').text(row.onCtr.toFixed(2)))
					.append($('<td>').text(row.off))
					.append($('<td>').text(row.offCtr.toFixed(2)));

				tr.appendTo(tableSubComponent);
			});

			el = document.getElementById("table-sub-component");
			tableSubComponent.appendTo($(el));

			// table by domPath

			let tableDomPath = $('<table>')
						.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

			tr = $('<tr>')
				.append($('<th>').text('CTR% by domPath ' + chartHeadingModifier).attr("colspan",7));

			tr.appendTo(tableDomPath);

			tr = $('<tr>')
				.append($('<th>').text('domPath'))
				.append($('<th>').text('Target'))
				.append($('<th>').text('Component'))
				.append($('<th>').text('Sub Component'))
				.append($('<th>').text('ON Clicks'))
				.append($('<th>').text('ON CTR'))
				.append($('<th>').text('OFF Clicks'))
				.append($('<th>').text('OFF CTR'));

			tr.appendTo(tableDomPath);

			newClickResults.forEach(function(row) {
				tr = $('<tr>')
					.append($('<td>').text(row.domPath))
					.append($('<td>').text(row.target))
					.append($('<td>').text(row.component))
					.append($('<td>').text(row.subComponent))
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

runQuery(targets);
