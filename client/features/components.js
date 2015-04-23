/*global $*/
'use strict';

require('isomorphic-fetch');
require('es6-promise').polyfill();

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
			var percent = 100 / data.result[0];
			data.result.slice(1).forEach(function (size, index) {
				var percentage = (percent * size).toFixed(2);
				$('<h2>')
					.addClass('component-usage')
					.html(
						'<span class="big-number">' + percentage + '%</span> of users have '
						+ data.descriptions[index + 1].toLowerCase() + ' in the last 24 hours'
					)
					.appendTo('.stats__container');
				});
		})
		.catch(function (e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('.stats__container');
		});
};
