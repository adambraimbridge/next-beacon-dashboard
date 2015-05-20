/*global $*/
'use strict';

require('isomorphic-fetch');
require('es6-promise').polyfill();
var queryString = require('query-string');

module.exports.init = function () {
	var queryParameters = queryString.parse(location.search);

	fetch('/api/funnel' + location.search, { credentials: 'same-origin' })
		.then(function(response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function(response) {
			if(response.code) {
				throw new Error(response.code + ': ' + response.message);
			}
			return response;
		})
		.then(function(response) {
			var percentage = (100 / response.result[1] * response.result[2]).toFixed(2);

			$('<h1>').text(' active usage')
				.prepend($('<span>').text(percentage + '%').addClass('big-number'))
				.appendTo('.stats__container');

			$('<h3>').text('How this is calculated:').appendTo('.stats__container');

			var table = $('<table>').addClass('explanation');

			var tr = $('<tr>')
				.append($('<td>').text('How many users visited next.ft in a one-week period, two weeks ago?'))
				.append($('<td>').html('<b>' + response.result[0] + ' users</b>'));
			tr.appendTo(table);

			var tr = $('<tr>')
				.append($('<td>').text('Of those users, how many visited next.ft in the last 7 days?'))
				.append($('<td>').html(response.result[1] + ' <i>active</i> users'));
			tr.appendTo(table);

			var tr = $('<tr>')
				.append($('<td>').text('How many of those active users used ' + queryParameters.feature + '?*'))
				.append($('<td>').html(response.result[2] + ' <i>active, feature-clicking</i> users'));
			tr.appendTo(table);

			var tr = $('<tr>')
				.append($('<td>').text("What's that as a percentage?"))
				.append($('<td>').text(percentage + '%'));
			tr.appendTo(table);

			table.appendTo('.stats__container');

			var beaconHref = 'https://beacon.ft.com/graph?event_collection=cta&metric=count&group_by=meta.domPath&timeframe=this_14_days&title=Trackable%20element:%20'+ queryParameters.cta +'&domPathContains='+ queryParameters.cta;
			$('<p>').html('<small>* These users clicked at least one <a href="' + beaconHref + '" target="_blank">"' + queryParameters.cta + '" trackable element</a> in the last two weeks.</small>')
				.appendTo('.stats__container');

		})
		.catch(function (e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('.stats__container');
		});
};
