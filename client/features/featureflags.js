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
		.then(function(response) {
			if(response.code) {
				throw new Error(response.code + ': ' + response.message);
			}
			return response;
		})
		.then(function(response) {
			var html = '';
			var percentage = (100 / response.result[1] * response.result[2]).toFixed(2);

			html = html + '<h1><span class="big-number">' + percentage + '%</span> active usage</h1>';
			html = html + '<h3>How this is calculated:</h3>';
			html = html + '<table><tr><td>How many users visited next.ft in a one-week period, two weeks ago?</td><td><b>' + response.result[0] + ' users</b></td></tr>';
			html = html + '<tr><td>Of those users, how many visited next.ft in the last 7 days?</td><td><b>' + response.result[1] + ' <i>active</i> users</b></td></tr>';
			html = html + '<tr><td>How many of those active users used globalNavigation?*</td><td><b>' + response.result[2] + ' <i>active, feature-clicking</i> users</b></td></tr>';
			html = html + '<tr><td>What\'s that as a percentage?</td><td><b>' + percentage + '%</b></td></tr></table>';
			html = html + '<br/><small>* These users clicked at least one <a href="https://goo.gl/FiWwaE" target="_blank">CTA element in "primary-nav"</a> in the last two weeks.</small>';

			$('.stats__container').append(html);
		})
		.catch(function (e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('.stats__container');
		});
};
