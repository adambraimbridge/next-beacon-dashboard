var _ = require('lodash');
var sameCollection = require('../utils/samecollection.js');
var describeVars = require('../utils/describe.js');

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
			})
			.filter(function(r) {
				return !_.isNull(r.x) && !_.isNaN(r.x) && r.y;
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
			.map(function(r) {
				return {
					y: r.y,
					x: query.logX ? Math.log(r.x)*Math.LOG10E : r.x
				};
			})
			.value(),
			color: palette.color(),
			name: sameCollection(query) ? describeVars(query, i) : result[0]
		};
	}).value();

	return _.extend({
		series: series,
	}, _.isArray(query.metric) ? {
		stack: false,
		renderer: 'line',
		xaxis: 'X',
		xaxisOptions: {
			tickFormat: function(x) {
				return query.logX ? Math.round(Math.pow(10, x)) : x;
			}
		}
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