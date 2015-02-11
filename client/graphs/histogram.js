var _ = require('lodash');

function sum(xs) {
	return xs.reduce(function(y, x) {
		return x + y;
	}, 0);
}

module.exports = function(data, palette, query) {
	var avgWindow = 4;
	var series = _(query.event_collection)
	.zip(_.pluck(data, 'result'))
	.map(function(result, i) {
		return {
			data: _(result[1]).map(function(a) {
				return {
					y: a.result,
					x: a[_.isArray(query.group_by) ?
						query.group_by[i] :
						query.group_by]
				};
			}).filter(function(r) {
				return !_.isNull(r.x) && r.y;
			})
			.sortBy('x')
			.chunk(avgWindow)
			.map(function(sub) {
				return {
					x: sum(_.pluck(sub, 'x')) / sub.length,
					y: sum(_.pluck(sub, 'y')),
				};
			})
			.sortBy('x')
			.value(),
			color: palette.color(),
			name: result[0]
		};
	}).value();

	return {
		series: series,
		stack: false,
		renderer: 'line',
		interpolation: 'linear',
		xaxis: 'X'
	};
};