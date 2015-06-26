
/* global Keen, console */

'use strict';

var confidence	= require('ab-test-confidence');
var visualise   = require('./visualise');

module.exports.on = new Keen.Query("funnel", { steps: [
		{
			event_collection: 'dwell',
			timeframe: { "start" : "2015-06-25T00:00:00.000Z", "end": new Date().toISOString() },
			actor_property: 'user.uuid',
			filters: [
				{"property_name":"page.location.type","operator":"eq","property_value":"stream"},
				{"property_name":"user.isStaff","operator":"eq","property_value":false},
				// {"property_name":"user.ab.myftEngagedFollow","operator":"eq","property_value":"on"}
			]
		},
		{
			event_collection: 'cta',
			timeframe: { "start" : "2015-06-25T00:00:00.000Z", "end": new Date().toISOString() },
			actor_property: 'user.uuid',
			filters: [
				{"property_name":"meta.domPath","operator":"eq","property_value":"myft-engaged-cta | follow"},
			]
		}
	]});

module.exports.off = new Keen.Query("funnel", { steps: [
		{
			event_collection: 'dwell',
			timeframe: { "start" : "2015-06-25T00:00:00.000Z", "end": new Date().toISOString() },
			actor_property: 'user.uuid',
			filters: [
				{"property_name":"page.location.type","operator":"eq","property_value":"stream"},
				{"property_name":"user.isStaff","operator":"eq","property_value":false},
				{"property_name":"user.myft.isEngagedTopic","operator":"exists","property_value":true},
				// {"property_name":"user.ab.myftEngagedFollow","operator":"eq","property_value":"off"}
			]
		},
		{
			event_collection: 'cta',
			timeframe: { "start" : "2015-06-25T00:00:00.000Z", "end": new Date().toISOString() },
			actor_property: 'user.uuid',
			filters: [
				{"property_name":"meta.domPath","operator":"contains","property_value": "follow"},
				{"property_name":"meta.domPath","operator":"not_contains","property_value":"myft-engaged-cta"}
			]
		}
	]});

module.exports.render = function (a, b, el) {

		console.log(a, b);
		var ab = { on: {}, off: {}, confidence: {} };

		// control
		ab.off.visitors = a.result[0];
		ab.off.conversions = a.result[1];

		// variant
		ab.on.visitors = b.result[0];
		ab.on.conversions = b.result[1];

		['on', 'off'].forEach(function (variant) {
			ab[variant].conversionRate = confidence.conversionRate(ab[variant].visitors, ab[variant].conversions);
			ab[variant].standardError  = confidence.standardError(ab[variant]);
			ab.confidence.zScore  = confidence.zScore(ab.on, ab.off);
			ab.confidence.pValue  = confidence.pValue(ab.confidence.zScore);
			ab.confidence.at90percent = confidence.at90percent(ab.confidence.pValue);
			ab.confidence.at95percent = confidence.at95percent(ab.confidence.pValue);
			ab.confidence.at99percent = confidence.at99percent(ab.confidence.pValue);
		});

		console.log({ stats: ab });

		visualise(el, {
			stats: ab,
			results: {
				a: a,
				b: b
			}
		});

	};