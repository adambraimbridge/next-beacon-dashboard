'use strict';

var _ = require('lodash');

function arrOrStr(obj, i) {
	return _.isArray(obj) ? obj[i] : obj;
}

module.exports = function describeVars(query, i) {
	return [
		arrOrStr(query.event_collection, i) + ', ',
		arrOrStr(query.metric, i) + ' ',
		arrOrStr(query.target_property, i)
	].join('');
};
