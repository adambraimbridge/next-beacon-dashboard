/* global Keen, console */

'use strict';

var confidence	= require('ab-test-confidence');
var _			= require('lodash');

module.exports = {

	/*
	 * - count unique by erights, group by 'views', 'ab:aa' , then filter every user with n views as 'converted'
	 * - produce an 'a' and 'b' visitors / conversions
	 * - push through the ab-test-confidence stats
	 */

	query: new Keen.Query('count', {
			timeframe: 'this_14_days',
			event_collection: 'dwell',
			latest: 10000,
			group_by: ['user.ab.aa', 'user.erights']
		}),

	render: function (el, response, opts, client) {

		var ab = { on: {}, off: {}, confidence: {} };

		// Turn the array of results in to two groups, keyed on the variant of the 'user.ab.aa' key
		//
		// So we end up with everyone in 'on' and 'off' in two arrays -> { on: [ ... ], off: [ ... ] }

		var c = _.groupBy(response.result, function (user) {
			return user['user.ab.aa'];
		});

		console.log(c);

		var conversion = 5;

		// control
		ab.off.visitors = c.off.length;
		ab.off.conversions = _.filter(c.off, function (user) {
			return user.result > conversion;
		}).length;

		// variant
		ab.on.visitors = c.on.length;
		ab.on.conversions = _.filter(c.on, function (user) {
			return user.result > conversion;
		}).length;

		['on', 'off'].forEach(function (variant) {
			ab[variant].conversionRate = confidence.conversionRate(ab[variant].visitors, ab[variant].conversions);
			ab[variant].standardError  = confidence.standardError(ab[variant]);
			ab.confidence.zScore  = confidence.zScore(ab.on, ab.off);
			ab.confidence.pValue  = confidence.pValue(ab.confidence.zScore);
			ab.confidence.at90percent = confidence.at90percent(ab.confidence.pValue);
			ab.confidence.at95percent = confidence.at95percent(ab.confidence.pValue);
			ab.confidence.at99percent = confidence.at99percent(ab.confidence.pValue);
		});

		console.log({ stats: ab, results: c });

		el.innerHTML = JSON.stringify({ confidence: ab });

	}
};
