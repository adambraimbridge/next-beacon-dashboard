var _ = require('lodash');

function sum(xs) {
	return xs.reduce(function(y, x) {
		return x + y;
	}, 0);
}

module.exports = function(data, palette, query) {
	var avgWindow = parseInt(query.window) || 4;
	var series = _([].concat(query.event_collection))
	.zip(_.pluck(data, 'result'))
	.map(function(result, i) {
		return {
			data: _(result[1]).map(function(a) {
				return {
					y: a.result,
					x: parseInt(a[_.isArray(query.group_by) ?
						query.group_by[i] :
						query.group_by])
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

	return _.extend({
		series: series,
	}, _.isArray(query.event_collection.length) ? {
		stack: false,
		renderer: 'line',
		interpolation: 'linear',
		xaxis: 'X'
	} : {
		renderer: 'bar',
		hoverOptions: {
			formatter: function(series, x, y) {
				var map = {
					1: 'visited one day',
					2: 'returned two days',
					3: 'returned three days',
					4: 'returned four days',
					5: 'returned five days',
					6: 'returned six days',
					7: 'returned every day',
				};
				return '<span>' + y + ' users ' + map[x] + ' this week</span>';
			}
		},
		hideLegend: true
	});
};