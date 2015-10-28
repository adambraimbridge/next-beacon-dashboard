/* global Keen , keen_project, keen_read_key, $ */

'use strict';

var articleCTAs = require('./article-ctas');
var queryString = require('querystring');
var moment = require('moment');
var queryParameters = queryString.parse(location.search.substr(1));
var referrerParameter = queryParameters.referrerType;
var chartHeadingModifier;
var standardQueryFilters = [
	{"operator":"eq",
	"property_name":"page.location.type",
	"property_value":"article"},
	{"operator":"exists",
	"property_name":"user.uuid",
	"property_value":true}];
var searchReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"search"}];
var socialReferrer = [{
	"operator":"eq",
	"property_name":"referringSource.websiteType",
	"property_value":"social-network"}];
var referrerFilters;
var targets = ["article", "stream", "homepage"];
var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});
var chartTotalCTR = new Keen.Dataviz();
var chartTargetCTR = new Keen.Dataviz();


var filterByTargets = function(targetTypes, category) {
	var resultArray = [];
	targetTypes.forEach(function(type) {
		articleCTAs.filter(function(cta) {
			return cta["target"] === type;
		})
		.map(function (filteredCTA) {
			resultArray.push(filteredCTA[category]);
		});
	});
	return resultArray;
};

var getUnique = function(nonUniqueArray) {
	var uniqueArray = [];
	nonUniqueArray.forEach(function(nonUnique) {
		if (uniqueArray.indexOf(nonUnique) === -1) {
			uniqueArray.push(nonUnique);
		}
	});
	return uniqueArray;
};

var metaDomPathArray = function(targetTypes) {
	return filterByTargets(targetTypes, "domPath");
};

var componentArray = function(targetTypes) {
	return getUnique(filterByTargets(targetTypes, "component"));
};

var subComponentArray = function(targetTypes) {
	return getUnique(filterByTargets(targetTypes, "subComponent"));
};

var timeframeArray = function(resultsObject) {
	var timeframes = [];
	resultsObject.result.forEach(function(res) {
		timeframes.push(res.timeframe);
	});
	return timeframes;
};

var ctaQuery = function(types) {
	var parameters = {
		eventCollection: "cta",
		filters: [
			{"operator": "in",
			"property_name":"meta.domPath",
			"property_value":metaDomPathArray(types)}]
				.concat(referrerFilters)
				.concat(standardQueryFilters),
		groupBy: "meta.domPath",
		interval: "weekly",
		targetProperty: "time.week",
		timeframe: queryParameters.timeframe || 'previous_2_weeks',
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
};

var baseQuery =	function() {
	var parameters = {
		eventCollection: "dwell",
		filters: []
			.concat(referrerFilters)
			.concat(standardQueryFilters),
		interval: "weekly",
		timeframe: queryParameters.timeframe || 'previous_2_weeks',
		timezone: "UTC",
		maxAge:10800
	};
	return new Keen.Query("count", parameters);
};


var runQuery = function(types) {

	client.run([ctaQuery(types), baseQuery()], function(err, res) {
		if (err) {
			console.log('err ', err);
		}
		else {
			var baseResults = res[1];
			var clickResults = res[0];

			clickResults.result.map(function(clickResult) {
				var baseResultsDate = baseResults.result.filter(function(el) {
					return JSON.stringify(el.timeframe) === JSON.stringify(clickResult.timeframe);
				});
				clickResult.value.map(function(val) {
					val.clicks = val.result;
					val.result = parseFloat((val.result * 100) / baseResultsDate[0].value);
				});
			});

			clickResults.result.forEach(function(domPathRes) {
				domPathRes.value.forEach(function(val) {
					var domPathObject = articleCTAs.filter(function(cta) {
								return val["meta.domPath"] === cta["domPath"];
						})[0];
					val["target"] = domPathObject["target"];
					val["component"] = domPathObject["component"];
					val["subComponent"] = domPathObject["subComponent"];
				});
			});

			// summarise at top level CTR
			var ctrResults = {result: []};
			clickResults.result.forEach(function(domPathRes) {
				var ctrObject = {};
				ctrObject.timeframe = domPathRes.timeframe;
				ctrObject.value = [];
				var ctrResult = 0;
				domPathRes.value.forEach(function(val) {
					ctrResult += parseFloat(val.result);
				});
				ctrObject.value.push({result: parseFloat(ctrResult).toFixed(2)});
				ctrResults.result.push(ctrObject);
			});

			chartTotalCTR
				.data({result: ctrResults.result})
				.chartType('linechart')
				.render();

			// summarise by target type
			var targetResults = {result: []};
			clickResults.result.forEach(function(domPathRes) {
				var targetObject = {};
				targetObject.timeframe = domPathRes.timeframe;
				targetObject.value = [];
				targets.forEach(function(target) {
					var targetResult = 0;
					domPathRes.value.forEach(function(val) {
						if (val.target === target) {
							targetResult += parseFloat(val.result);
						}
					});
					targetObject.value.push({target: target, result: parseFloat(targetResult).toFixed(2)});
				});
				targetResults.result.push(targetObject);
			});

			chartTargetCTR
				.data({result: targetResults.result})
				.chartType('linechart')
				.render();

			var tableArray = [];
			clickResults.result[0].value.forEach(function(val) {
				var tableRow = {
					target: val.target,
					"meta.domPath": val["meta.domPath"],
					component: val.component,
					subComponent: val.subComponent
				};
				timeframeArray(baseResults).forEach(function(val, index) {
					tableRow["timeframe-"+index] = val;
				});
				tableArray.push(tableRow);
			});

			tableArray.forEach(function(tableRow) {
				timeframeArray(baseResults).forEach(function(time, index) {
					var filteredByDate = clickResults.result.filter(function(res) {
						return JSON.stringify(res.timeframe) === JSON.stringify(time);
					});
					var filteredByDomPath = filteredByDate[0].value.filter(function(res) {
						return res["meta.domPath"] === tableRow["meta.domPath"];
					});
					tableRow["timeframe-"+index] = filteredByDomPath[0].result;
				});
			});

			tableArray.forEach(function(tableRow) {
				timeframeArray(baseResults).forEach(function(time, index) {
					tableRow[moment(time.end).format('DD MMM YYYY')] = tableRow["timeframe-"+index];
					delete tableRow["timeframe-"+index];
				});
			});

			var mostRecent = moment(timeframeArray(baseResults)[timeframeArray(baseResults).length - 1].end).format('DD MMM YYYY');
			tableArray.sort(function(a, b) {
				return b[mostRecent] - a[mostRecent];
			});

			//draw the table
			var table = $('<table>')
						.addClass("o-table o-table--compact o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

			var tr = $('<tr>')
				.append($('<th>').text('CTR% by element ' + chartHeadingModifier).attr("colspan",(4 + timeframeArray(baseResults).length)));

			tr.appendTo(table);

			tr = $('<tr>')
				.append($('<th>').text('Target').attr("id", "target-header"))
				.append($('<th>').text('Component').attr("id", "component-header"))
				.append($('<th>').text('Sub Component').attr("id", "sub-component-header"))
				.append($('<th>').text('domPath'));

			timeframeArray(baseResults).forEach(function(time) {
				tr.append($('<th data-o-table-data-type="numeric">').text(moment(time.end).format('DD MMM YYYY')));
			});

			tr.appendTo(table);

			tableArray.forEach(function(tableRow, index) {
				tr = $('<tr>').attr("id", index)
					.append($('<td>').text(tableRow.target))
					.append($('<td>').text(tableRow.component))
					.append($('<td>').text(tableRow.subComponent))
					.append($('<td>').text(tableRow["meta.domPath"]));

				timeframeArray(baseResults).forEach(function(time) {
					tr.append($('<td data-o-table-data-type="numeric">').text(parseFloat(tableRow[moment(time.end).format('DD MMM YYYY')]).toFixed(2)));
				});

				tr.appendTo(table);
			});

			var el = document.getElementById("ctr-by-element-table");
			table.appendTo($(el));

			// add breakdown selector
			var targetSelectEl = $('<select>').attr("id", "target-dropdown");
			var targetOptions = ['all'].concat(targets);
			targetOptions.forEach(target => {
					targetSelectEl.append($('<option>').attr("value", target).text(target));
			});
			targetSelectEl.appendTo(document.getElementById("target-header"));

			var componentSelectEl = $('<select>').attr("id", "component-dropdown");
			var componentOptions = ['all'].concat(componentArray(targets));
			componentOptions.forEach(component => {
					componentSelectEl.append($('<option>').attr("value", component).text(component));
			});
			componentSelectEl.appendTo(document.getElementById("component-header"));

			var subComponentSelectEl = $('<select>').attr("id", "sub-component-dropdown");
			var subComponentOptions = ['all'].concat(subComponentArray(targets));
			subComponentOptions.forEach(subComponent => {
					subComponentSelectEl.append($('<option>').attr("value", subComponent).text(subComponent));
			});
			subComponentSelectEl.appendTo(document.getElementById("sub-component-header"));

			// handle for select change
			var targetHandler = function(ev) {
				$('#component-dropdown').find('option:first').attr('selected', 'selected');
				$('#sub-component-dropdown').find('option:first').attr('selected', 'selected');
				tableArray.forEach(function(el, index) {
					document.getElementById(index).style.display = (ev.target.value === "all" || el.target === ev.target.value) ? 'table-row' : 'none';
				});
			};
			document.getElementById("target-dropdown").addEventListener('change', targetHandler);
			document.getElementById("target-dropdown").dispatchEvent(new Event('change'));

			var componentHandler = function(ev) {
				$('#target-dropdown').find('option:first').attr('selected', 'selected');
				$('#sub-component-dropdown').find('option:first').attr('selected', 'selected');
				tableArray.forEach(function(el, index) {
					document.getElementById(index).style.display = (ev.target.value === "all" || el.component === ev.target.value) ? 'table-row' : 'none';
				});
			};
			document.getElementById("component-dropdown").addEventListener('change', componentHandler);
			document.getElementById("component-dropdown").dispatchEvent(new Event('change'));

			var subComponentHandler = function(ev) {
				$('#target-dropdown').find('option:first').attr('selected', 'selected');
				$('#component-dropdown').find('option:first').attr('selected', 'selected');
				tableArray.forEach(function(el, index) {
					document.getElementById(index).style.display = (ev.target.value === "all" || el.subComponent === ev.target.value) ? 'table-row' : 'none';
				});
			};
			document.getElementById("sub-component-dropdown").addEventListener('change', subComponentHandler);
			document.getElementById("sub-component-dropdown").dispatchEvent(new Event('change'));

		}
	});
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

chartTotalCTR
	.el(document.getElementById("ctr-total"))
	.height(450)
	.title('CTR% on Article Pages by week - ' + chartHeadingModifier)
	.prepare();

chartTargetCTR
	.el(document.getElementById("ctr-target"))
	.height(450)
	.title('CTR% on Article Pages by target and week - ' + chartHeadingModifier)
	.prepare();

runQuery(targets);
