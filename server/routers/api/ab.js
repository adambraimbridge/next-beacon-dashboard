'use strict';

var confidence	= require('ab-test-confidence');
var keenIO		= require('keen.io');
var _			= require('lodash');

var keen = keenIO.configure({
	projectId: process.env['KEEN_PROJECT_ID'],
	readKey: process.env['KEEN_READ_KEY']
});

module.exports = function (req, res) {
	
	/*
	 * - count unique by erights, group by 'views', 'ab:aa' , then filter every user with n views as 'converted'
	 * - produce an 'a' and 'b' visitors / conversions
	 * - push through the ab-test-confidence stats
	 */

	var group_by = req.query.group_by; 

	var q = new keenIO.Query('count', {
		timeframe: req.query.timeframe || 'this_14_days',
		event_collection: req.query.event_collection || 'dwell',
		group_by: [group_by, 'user.erights'],
		latest: req.query.limit || 10000,
		interval: "yearly",
	});

	keen.run(q, function(err, response) {

		if (err) {
			res.json(err);
			return;
		}

		var ab = { on: {}, off: {}, confidence: {} };

		var c = _.groupBy(response.result[0].value, function (user) {
			return user[group_by];
		}); 

		var conversion = req.query.conversion || 5;

		// control
		ab.off.visitors = c.off.length;
		ab.off.conversions = _.filter(c.off, function (user) { return user.result > conversion }).length; // FIXME arbitrary conversion
		
		// variant
		ab.on.visitors = c.on.length;
		ab.on.conversions = _.filter(c.on, function (user) { return user.result > conversion }).length; // FIXME arbitrary conversion

		['on', 'off'].forEach(function (variant) {
			ab[variant].conversionRate = confidence.conversionRate(ab[variant].visitors, ab[variant].conversions);
			ab[variant].standardError  = confidence.standardError(ab[variant]);
			ab.confidence.zScore  = confidence.zScore(ab.on, ab.off);
			ab.confidence.pValue  = confidence.pValue(ab.confidence.zScore);
			ab.confidence.at90percent = confidence.at90percent(ab.confidence.pValue);
			ab.confidence.at95percent = confidence.at95percent(ab.confidence.pValue);
			ab.confidence.at99percent = confidence.at99percent(ab.confidence.pValue);
		});

		res.json({ stats: ab, results: c });

	});
};

module.exports.article = function (req, res) { };
