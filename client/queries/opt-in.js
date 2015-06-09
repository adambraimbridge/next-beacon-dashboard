/* global Keen */

'use strict';

var qs = require('query-string');
var q = qs.parse(location.search);

module.exports.innie = {

	query: new Keen.Query('count_unique', {
			timeframe: q.timeframe || 'this_24_hours',
			target_property: 'user.uuid',
			event_collection: 'optin',
			filters: [
				{
					property_name: 'meta.type',
					operator: 'eq',
					property_value: 'in'
				},
				{
					property_name: 'user.isStaff',
					operator: 'eq',
					property_value: false
				}
			]
		})
};

module.exports.outie = {

	query: new Keen.Query('count_unique', {
			timeframe: q.timeframe || 'this_24_hours',
			target_property: 'user.uuid',
			event_collection: 'optin',
			filters: [
				{
					property_name: 'meta.type',
					operator: 'eq',
					property_value: 'out'
				},
				{
					property_name: 'user.isStaff',
					operator: 'eq',
					property_value: false
				}
			]
		})
};

module.exports.lastWeek = {

	query: new Keen.Query('count_unique', {
			timeframe: q.timeframe || 'this_7_days',
			target_property: 'user.uuid',
			event_collection: 'optin',
			group_by: ['meta.type'],
			filters: [
				{
					property_name: 'user.isStaff',
					operator: 'eq',
					property_value: false
				}
			]
		})
};

module.exports.reasons = {

	query: new Keen.Query('count_unique', {
			timeframe: q.timeframe || 'this_7_days',
			target_property: 'user.uuid',
			event_collection: 'optin',
			group_by: ['meta.reason'],
			interval: 'daily',
			filters: [
				{
					property_name: 'meta.type',
					operator: 'eq',
					property_value: 'out'
				},
				{
					property_name: 'user.isStaff',
					operator: 'eq',
					property_value: false
				},
				{
					property_name: 'meta.reason',
					operator: 'ne',
					property_value: 'unknown'
				}
			]
		})
};

module.exports.difficultNavigation = {

	query: new Keen.Query('count_unique', {
			timeframe: q.timeframe || 'this_7_days',
			target_property: 'user.uuid',
			event_collection: 'optin',
			group_by: ['meta.difficultNavReason'],
			filters: [
				{
					property_name: 'meta.reason',
					operator: 'eq',
					property_value: 'difficult-nav'
				},
				{
					property_name: 'meta.reason',
					operator: 'exists',
					property_value: true
				},
				{
					property_name: 'meta.type',
					operator: 'eq',
					property_value: 'out'
				},
				{
					property_name: 'user.isStaff',
					operator: 'eq',
					property_value: false
				}
			]
		})
};
