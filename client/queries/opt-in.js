/* global Keen */

'use strict';

module.exports.innie = {

	query: new Keen.Query('count_unique', {
			timeframe: 'this_24_hours',
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
			timeframe: 'this_24_hours',
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
			timeframe: 'this_7_days',
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
			timeframe: 'this_7_days',
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
				}
			]
		})
};

module.exports.difficultNavigation = {

	query: new Keen.Query('count_unique', {
			timeframe: 'this_7_days',
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
