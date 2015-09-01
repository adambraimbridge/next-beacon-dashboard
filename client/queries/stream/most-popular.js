/* global Keen, $ */

'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var decodeTable = {
	"https://next.ft.com/stream/sectionsId/MQ==-U2VjdGlvbnM=": "World",
	"https://next.ft.com/stream/sectionsId/NzE=-U2VjdGlvbnM=": "Markets",
	"https://next.ft.com/stream/sectionsId/Mjk=-U2VjdGlvbnM=": "Companies",
	"https://next.ft.com/stream/sectionsId/MTE2-U2VjdGlvbnM=": "Opinion",
	"https://next.ft.com/stream/sectionsId/Ng==-U2VjdGlvbnM=": "UK",
	"https://next.ft.com/stream/sectionsId/OQ==-U2VjdGlvbnM=": "Europe",
	"https://next.ft.com/stream/sectionsId/MTQ4-U2VjdGlvbnM=": "Life & Arts",
	"https://next.ft.com/stream/regionsId/TnN0ZWluX0dMX0NO-R0w=": "China",
	"https://next.ft.com/stream/sectionsId/NTc=-U2VjdGlvbnM=": "Financials",
	"https://next.ft.com/stream/brandId/YzhlNzZkYTctMDJiNy00NTViLTk3NmYtNmJjYTE5NDEyM2Yw-QnJhbmRz": "Lex",
	"https://next.ft.com/stream/sectionsId/MzA=-U2VjdGlvbnM=": "Energy",
	"https://next.ft.com/stream/sectionsId/MTA1-U2VjdGlvbnM=": "Commodities",
	"https://next.ft.com/stream/brandId/QnJhbmRzXzEwOQ==-QnJhbmRz": "Lunch with the FT",
	"https://next.ft.com/stream/sectionsId/MTI1-U2VjdGlvbnM=": "Work & Career",
	"https://next.ft.com/stream/sectionsId/MTE=-U2VjdGlvbnM=": "Asia Pacific",
	"https://next.ft.com/stream/sectionsId/MTE3-U2VjdGlvbnM=": "Columnists",
	"https://next.ft.com/stream/sectionsId/NTM=-U2VjdGlvbnM=": "Technology",
	"https://next.ft.com/stream/topicsId/ZmEzMmRmNDAtNDc0Zi00ODk3LWE2ZmQtZWFmYzJlZTRjZTVk-VG9waWNz": "Greece Debt Crisis",
	"https://next.ft.com/stream/sectionsId/Mg==-U2VjdGlvbnM=": "US & Canada",
	"https://next.ft.com/stream/brandId/QnJhbmRzXzExMg==-QnJhbmRz": "Person in the News",
	"https://next.ft.com/stream/sectionsId/MTAz-U2VjdGlvbnM=": "Currencies",
	"https://next.ft.com/stream/brandId/ZWI2YTE0YjgtOTIyYy00OTIyLWExOTYtZmRmNzk0YzA4NGFk-QnJhbmRz": "Global Market Overview",
	"https://next.ft.com/stream/sectionsId/MTA3-U2VjdGlvbnM=": "Global Economy",
	"https://next.ft.com/stream/sectionsId/NzI=-U2VjdGlvbnM=": "FTfm Fund Management"
};

var render = function (el, results, opts) {

	var resultArray = results.result;

	var totalStreamArray = resultArray.map(function(result) {
		return result.result;
	});

	var totalStream = totalStreamArray.reduce(function(a, b) {
		return a + b;
	});

	resultArray = resultArray.sort(function(a, b) {
		return b.result-a.result;
	});

	var restTotal = resultArray.slice(20).map(function(item) {
		return item.result;
	}).reduce(function(a, b){
		return a + b;
	});

	resultArray = resultArray.splice(0,20);

	resultArray.map(function(result) {
		result.decode = decodeTable[result["page.location.href"]] ? decodeTable[result["page.location.href"]] : "Not in decode table";
	});

	resultArray.push({decode: "Rest", "page.location.href": "", result: restTotal});

	var title = $('<h2>').text("Top 20 Stream Pages Loaded" + ' (' + (queryParameters.timeframe ? queryParameters.timeframe : 'previous_14_days') + ')');
	var table = $('<table>')
		.addClass("o-table o-table--horizontal-lines o-table--vertical-lines o-table--horizontal-borders o-table--vertical-borders");

	var tr = $('<tr>')
		.append($('<th data-o-table-data-type="numeric">').text('Rank'))
		.append($('<th>').text('Stream Title'))
		.append($('<th>').text('Stream Link'))
		.append($('<th data-o-table-data-type="numeric">').text('Number'))
		.append($('<th data-o-table-data-type="numeric">').text('% Stream Pages'));

	tr.appendTo(table);

	resultArray.map(function(result, index) {
		var tr = $('<tr>')
			.append($('<td data-o-table-data-type="numeric">').text(index + 1))
			.append($('<td>').text(result.decode))
			.append($('<td>').append($('<a>').attr({href:result["page.location.href"], target: "_blank"}).text(result["page.location.href"])))
			.append($('<td data-o-table-data-type="numeric">').text(result.result))
			.append($('<td data-o-table-data-type="numeric">').text(Math.round(result.result * 100 / totalStream) + '%'));
		tr.appendTo(table);
	});

	title.appendTo($(el));
	table.appendTo($(el));

};

module.exports = {

	query: new Keen.Query("count", {
		eventCollection: "dwell",
		filters: [
			// filter removed as deprecated (temporarily?)
			// {"operator":"eq",
			// "property_name":"user.isStaff",
			// "property_value":false},
			{"operator":"eq",
			"property_name":"page.location.type",
			"property_value":"stream"}],
		groupBy: "page.location.href",
		targetProperty: "time.day",
		timeframe: queryParameters.timeframe || "previous_14_days",
		timezone: "UTC"
	}),
	render: render
};
