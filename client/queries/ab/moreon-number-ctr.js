/* global Keen , keen_project, keen_read_key, $ */

'use strict';

const articleCTAs = require('../article/article-ctas');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const referrerParameter = queryParameters.referrerType;
const displayParameter = queryParameters.displayType;
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

// TO DO refactor this into a function
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

// TO DO add a function for display filter

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

const referrerFilters = referrerParameter ? getReferrerFilter() : [];
const displayFilters = displayParameter ? getDisplayFilter() : [];
let chartHeadingModifier;
let clickResults;
let baseResults;

function getReferrerFilter () {
	return [{
					"operator":"eq",
					"property_name":"referringSource.websiteType",
					"property_value": referrerParameter
				}];
}

function getDisplayFilter () {
	// TO DO map parameter to array of sizes
	return [{
					"operator":"eq",
					"property_name":"referringSource.websiteType",
					"property_value": XXXX 
				}];
}

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
		if (uniqueArray.indexOf(nonUnique) === -1 && typeof nonUnique !== "undefined") {
			uniqueArray.push(nonUnique);
		}
	});
	uniqueArray.sort((a,b) => a-b);
	return uniqueArray;
}

function metaDomPathArray(subComponentTypes) {
	return filterBySubCompnents(subComponentTypes, "domPath");
}

function targetArray(subComponentTypes) {
	return getUnique(filterBySubCompnents(subComponentTypes, "target"));
}

function aggregation(options) {
	let resArray = clickResults;
	if (options.variant)
		resArray = clickResults
			.filter(res => res["ab.articleMoreOnNumber"] === options.variant);
	if (options.storyPackage === "yes") {
		resArray = resArray.filter(res => res["content.features.hasStoryPackage"] === true);
	}
	if (options.storyPackage === "no") {
		resArray = resArray.filter(res => res["content.features.hasStoryPackage"] === false);
	}
	if (options.target) {
		resArray = resArray.filter(res => res.target === options.target);
	}
	if (options.metaDomPath) {
		resArray = resArray.filter(res => res["meta.domPath"] === options.metaDomPath);
	}
	if (options.linkIndex) {
		resArray = resArray.filter(res => res.linkIndex === options.linkIndex);
	}
	if (options.totalLinks) {
		resArray = resArray.filter(res => res.totalLinks === options.totalLinks);
	}
	if (options && options.resType === "ctr" && resArray.length > 0) {
		const ctrType = (options.storyPackage === "yes"
									|| options.storyPackage === "no"
									|| options.totalLinks > 0)
									? "ctrSpecific" : "ctrHighLevel";
		return resArray
			.map(res => res[ctrType])
			.reduce((carry, item) => carry + item);
	} else if (options && options.resType === "clicks" && resArray.length > 0) {
		return resArray
			.map(res => res.result)
			.reduce((carry, item) => carry + item);
	} else {
		return 0;
	}
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

				clickResults.forEach(clickResult => {
					// Calculate Link Index for each result
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
					// Decorate with total links
					clickResult.totalLinks = storyPackageLinks + moreOnTotalLinks;
					// Decorate with ctr for story package variant
					clickResult.ctrSpecific = parseFloat(
						(clickResult.result * 100)
							/ baseResults.find(res => {
								if (
									res["content.features.hasStoryPackage"] === clickResult["content.features.hasStoryPackage"]
									&& res["ab.articleMoreOnNumber"] === clickResult["ab.articleMoreOnNumber"]
								) {
									return res;
								}
							}).result
					);
					// Decorate with ctr regardless of story package variant
					let highLevelPageViews = baseResults
						.filter(res => res["ab.articleMoreOnNumber"] === clickResult["ab.articleMoreOnNumber"])
						.map(res => res.result)
						.reduce((carry, item) => carry + item);
					clickResult.ctrHighLevel = parseFloat((clickResult.result * 100) / highLevelPageViews);
					// Decorate with link target
					clickResult.target = articleCTAs.find(cta => cta.domPath === clickResult["meta.domPath"]).target;
				});

				// Draw key metrics

				metricCTRThree
					.data({result: aggregation({variant: "three", resType: "ctr"})})
					.chartType("metric")
					.render();

				metricCTRSeven
					.data({result: aggregation({variant: "seven", resType: "ctr"})})
					.chartType("metric")
					.render();

				metricCTRNine
					.data({result: aggregation({variant: "nine", resType: "ctr"})})
					.chartType("metric")
					.render();

				metricCTRControl
					.data({result: aggregation({variant: "control", resType: "ctr"})})
					.chartType("metric")
					.render();

				metricCTRThreeStoryPackage
					.data({result: aggregation({variant: "three", resType: "ctr", storyPackage: "yes"})})
					.chartType("metric")
					.render();

				metricCTRSevenStoryPackage
					.data({result: aggregation({variant: "seven", resType: "ctr", storyPackage: "yes"})})
					.chartType("metric")
					.render();

				metricCTRNineStoryPackage
					.data({result: aggregation({variant: "nine", resType: "ctr", storyPackage: "yes"})})
					.chartType("metric")
					.render();

				metricCTRControlStoryPackage
					.data({result: aggregation({variant: "control", resType: "ctr", storyPackage: "yes"})})
					.chartType("metric")
					.render();

				metricCTRThreeNoStoryPackage
					.data({result: aggregation({variant: "three", resType: "ctr", storyPackage: "no"})})
					.chartType("metric")
					.render();

				metricCTRSevenNoStoryPackage
					.data({result: aggregation({variant: "seven", resType: "ctr", storyPackage: "no"})})
					.chartType("metric")
					.render();

				metricCTRNineNoStoryPackage
					.data({result: aggregation({variant: "nine", resType: "ctr", storyPackage: "no"})})
					.chartType("metric")
					.render();

				metricCTRControlNoStoryPackage
					.data({result: aggregation({variant: "control", resType: "ctr", storyPackage: "no"})})
					.chartType("metric")
					.render();

				// Draw table - by target
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

				targetArray(subComponents).forEach(target => {
					tr = $('<tr>')
						.append($('<td>').text(target))
						.append($('<td>').text(aggregation({variant: "three", resType: "clicks", target: target})))
						.append($('<td>').text(aggregation({variant: "three", resType: "ctr", target: target}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "control", resType: "clicks", target: target})))
						.append($('<td>').text(aggregation({variant: "control", resType: "ctr", target: target}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "seven", resType: "clicks", target: target})))
						.append($('<td>').text(aggregation({variant: "seven", resType: "ctr", target: target}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "nine", resType: "clicks", target: target})))
						.append($('<td>').text(aggregation({variant: "nine", resType: "ctr", target: target}).toFixed(2)));

					tr.appendTo(tableTarget);
				})

				let el = document.getElementById("table-target");
				tableTarget.appendTo($(el));

				// Draw table by domPath

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

				metaDomPathArray(subComponents).forEach(metaDomPath => {
					tr = $('<tr>')
						.append($('<td>').text(metaDomPath))
						.append($('<td>').text(articleCTAs.find(cta => cta.domPath === metaDomPath).target))
						.append($('<td>').text(aggregation({variant: "three", resType: "clicks", metaDomPath: metaDomPath})))
						.append($('<td>').text(aggregation({variant: "three", resType: "ctr", metaDomPath: metaDomPath}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "control", resType: "clicks", metaDomPath: metaDomPath})))
						.append($('<td>').text(aggregation({variant: "control", resType: "ctr", metaDomPath: metaDomPath}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "seven", resType: "clicks", metaDomPath: metaDomPath})))
						.append($('<td>').text(aggregation({variant: "seven", resType: "ctr", metaDomPath: metaDomPath}).toFixed(2)))
						.append($('<td>').text(aggregation({variant: "nine", resType: "clicks", metaDomPath: metaDomPath})))
						.append($('<td>').text(aggregation({variant: "nine", resType: "ctr", metaDomPath: metaDomPath}).toFixed(2)));

					tr.appendTo(tableDomPath);
				});

				el = document.getElementById("table-dom-path");
				tableDomPath.appendTo($(el));

				// Draw table of ctr By Link Index and Total Links

				const uniqueLinkIndices = getUnique(clickResults.map(res => res.linkIndex));
				const uniqueTotalLinks = getUnique(clickResults.map(res => res.totalLinks));

				let tableLinkIndex = $('<table>')
							.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

				// Table title
				tr = $('<tr>')
					.append($('<th>').text('CTR% by Link Index ' + chartHeadingModifier).attr("colspan",9));
				tr.appendTo(tableLinkIndex);

				// Table column headings
				tr = $('<tr>')
					.append($('<th>').text('Link Index'));
				uniqueTotalLinks.forEach(totalLinks => {
					tr.append($('<th>').text(`${totalLinks} Links`))
				});
				tr.appendTo(tableLinkIndex);

				// Append row per link index
				uniqueLinkIndices.forEach(linkIndex => {
					tr = $('<tr>')
						.append($('<td>').text(linkIndex));
					uniqueTotalLinks.forEach(totalLinks => {
						tr.append($('<td>').text(aggregation({totalLinks: totalLinks, linkIndex: linkIndex, resType: "ctr"}).toFixed(2)));
					})
					tr.appendTo(tableLinkIndex);
				});

				// Append row of total CTR%
				tr = $('<tr>').append($('<td>').text('Total CTR%'));
				uniqueTotalLinks.forEach(totalLinks => {
					tr.append($('<td>').text(aggregation({totalLinks: totalLinks, target: "article", resType: "ctr"}).toFixed(2)));
				});
				tr.appendTo(tableLinkIndex);

				// Append row of total clicks
				tr = $('<tr>').append($('<td>').text('Total Clicks'));
				uniqueTotalLinks.forEach(totalLinks => {
					tr.append($('<td>').text(aggregation({totalLinks: totalLinks, target: "article", resType: "clicks"})));
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

switch (displayParameter) {
	case 'mobile':
		displayFilters = mobileDisplay;
		chartHeadingModifier = '(page viewed on MOBILE)';
		break;
	case 'tablet':
		displayFilters = tabletDisplay;
		chartHeadingModifier = '(page viewed on TABLET)';
		break;
	case 'computer':
		displayFilters = computerDisplay;
		chartHeadingModifier = '(page viewed on COMPUTER)';
		break;
	default:
		displayFilters = [];
		chartHeadingModifier = '(page viewed across ALL DEVICES)';
}

// Prepare metric placeholders
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
	.title("% CTR - FIVE (C)")
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
	.title("% CTR - FIVE (C)")
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
	.title("% CTR - FIVE (C)")
	.prepare();

runQuery(subComponents);
