/*global $*/
'use strict';

var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');

module.exports.init = function () {
	fetch('/api/funnel' + location.search, { credentials: 'same-origin' })
		.then(function(response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function(data) {
			if(data.code) {
				throw new Error(data.code + ': ' + data.message);
			}

			return data;
		})
		.then(function(data) {

			console.log(data);

			var total = data.result[0];
			var table = $('<table>');

			var tr = $('<tr>')
				.append($('<th>').text('Step'))
				.append($('<th>').text('Number of users'))
				.append($('<th class="funnel__cell">').text(''))
				.append($('<th class="funnel__percent">').text(''));

			tr.appendTo(table);

			data.result.map(function(row, index) {
				var tr = $('<tr>')
					.append($('<td>').text(data.descriptions[index]))
					.append($('<td>').text(row))
					.append($('<td class="funnel__cell">').html('<span class="funnel" style="width: ' + ((row/total)*100) + '%"></span>'))
					.append($('<td class="funnel__percent">').text((Math.round((row / total) * 100) / 100) * 100 + '%'));
				tr.appendTo(table);
			});
		
			$('#chart_container').empty();
			table.prependTo('#chart_container');

		})
		.catch(function (e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('#chart_container');
		});
};
