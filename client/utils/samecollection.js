'use strict';

var _ = require('lodash');
module.exports = function(query) {
	return !_.isArray(query.event_collection) || _(query.event_collection).every(function(a) {
			return a === query.event_collection[0];
		});
};
