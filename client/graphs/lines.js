var _ = require('lodash');

function arrOrStr(obj, i) {
	return _.isArray(obj) ? obj[i] : obj;
}

function describeVars(query, i) {
	return [
		arrOrStr(query.event_collection, i) + ', ',
		arrOrStr(query.metric, i) + ' ',
		arrOrStr(query.target_property, i)
	].join('');
}

module.exports = function(data, palette, query) {
	var sameCollection = _(query.event_collection).every(function(a) {
		return a === query.event_collection[0];
	});

	var series = _(query.event_collection)
		.zip(_.pluck(data, 'result'))
		.map(function(r, i) {
			var collection = sameCollection ? describeVars(query, i) : r[0];
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