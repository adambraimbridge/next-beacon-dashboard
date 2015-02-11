var _ = require('lodash');

module.exports = function(data, palette, query) {
	var series = _(query.event_collection)
		.zip(_.pluck(data, 'result'))
		.map(function(r) {
			var collection = r[0];
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

	console.log(series);

	return {
		series: series,
		renderer: 'line',
		stack: false
	};
};