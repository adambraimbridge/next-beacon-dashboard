'use strict';

var moment = require('moment');

module.exports = {
	uuid: {
		"property_name": "page.capi.id",
		"operator": "eq",
		hidden: true,
		explain: function() {
			return 'article <a href="http://next.ft.com/' + this.property_value + '">' + this.property_value  +'</a>';
		}
	},
	href: {
		"property_name": "page.location.href",
		"operator": "contains",
		hidden: true,
		explain: function() {
			return 'by href';
		}
	},
	pageType: {
		"property_name": "page.location.type",
		"operator": "eq",
		title: 'Page type',
		values: {
			frontpage: 'Frontpage',
			article: 'Article',
			stream: 'Stream',
			search: 'Search',
			my: 'My',
			group: 'Group'
		},
		explain: function() {
			return 'by ' + this.property_value;
		}
	},
	erights: {
		"property_name": "user.erights",
		"operator": "eq",
		hidden: true,
		explain: function() {
			return 'erights ' + this.property_value;
		}
	},
	flags: {
		"property_name": "user.flags",
		"operator": "eq",
		hidden: true,
		explain: function() {
			return 'by flag <a href="http://next.ft.com/__toggler">' + this.property_value + '</a>';
		}
	},
	domPath: {
		"property_name": "meta.domPath",
		"operator": "eq",
		hidden: true,
		explain: function() {
			return false;
		}
	},
	domPathContains: {
		"property_name": "meta.domPath",
		"operator": "contains",
		hidden: true,
		explain: function() {
			return false;
		}
	},
	inTheLast: {
		property_name: 'time.day',
		operator: 'gt',
		hidden: true,
		explain: function() {
			return 'starting ' + moment(this.property_value).fromNow();
		}
	},
	exists: {
		property_value: true,
		operator: 'exists',
		hidden: true,
		explain: function() {
			return 'property exists';
		}
	},
	notUnknown: {
		property_value: 'unknown',
		operator: 'ne',
		hidden: true,
		explain: function() {
			return 'property value is not "unknown"';
		}
	},
	isUnknown: {
		property_value: 'unknown',
		operator: 'eq',
		hidden: true,
		explain: function() {
			return 'property value is equal to "unknown"';
		}
	},
	greaterThan: {
		operator: 'gt',
		hidden: true,
		explain: function() {
			return this.property_name + ' is greater than ' + this.property_value;
		}
	}
};
