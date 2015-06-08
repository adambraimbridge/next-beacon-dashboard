/*global $*/
'use strict';

require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');

module.exports.init = function() {
	fetch('/api' + location.search, { credentials: 'same-origin' })
		.then(function(response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function(data) {
			if (data.code) {
				throw new Error(data.code + ': ' + data.message);
			}

			return data;
		})
		.then(function(data) {
			var optEls = document.getElementsByClassName('opt');

			if (!optEls.length || !data.result.length) { return; }

			var rawOptTypes = data.result[0].value;

			// Cleans up to be { in: n, out: n }
			var optTypes = _.object(
				_.pluck(rawOptTypes, 'meta.type'),
				_.pluck(rawOptTypes, 'result')
			);

			var grandTotal = _.reduce(optTypes, function(m, typeTotal) {
				return m + typeTotal;
			}, 0);

			document.getElementById('opted-in').style.width = Math.floor(optTypes['in'] / grandTotal * 100) + '%';
			document.getElementById('opted-in-p').innerHTML = optTypes['in'];

			document.getElementById('opted-out').style.width = Math.floor(optTypes['out'] / grandTotal * 100) + '%';
			document.getElementById('opted-out-p').innerHTML = optTypes['out'];

			optEls[0].className += ' opt--active';
		})
		.catch(function(e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('#chart_container');
		});
};