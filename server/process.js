'use strict';
var _ = require('../bower_components/lodash/lodash');

exports.countAs = function(prop, data) {
	return {
		result: _(data.result)
			.countBy('result')
			.pairs()
			.map(function(p) {
				return _.zipObject([prop, 'result'], p);
			})
			.value()
	};
};
