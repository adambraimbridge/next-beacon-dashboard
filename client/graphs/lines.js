'use strict';
var _ = require('lodash');
var describeVars = require('../utils/describe.js');
var sameCollection = require('../utils/samecollection.js');

module.exports = function(data, palette, query) {
	var series = _(query.event_collection)
		.zip(_.pluck(data, 'result'))
		.map(function(r, i) {
			var collection = sameCollection(query) ? describeVars(query, i) : r[0];
			var results = r[1];

			return {
				data: results.map(function (result) {
					return {
						x: new Date(result.timeframe.start).valueOf() / 1000,
						y: result.value
					};
				}),
				name: collection,
				color: palette.color()
			};
		}).value();

	return {
		series: series,
		renderer: 'area',
		stack: false
	};
};