'use strict';

module.exports = function(data, palette, query) {
	var key = data.result.map(function(a) {
		return Object.keys(a.value[0]).filter(function(k) {
			return k !== 'result';
		});
	})[0];

	var series = data.result[0].value.map(function(a, n) {
		return {
			data: data.result.map(function(a) {
				return {
					x: new Date(a.timeframe.start).valueOf() / 1000,
					y: a.value[n].result
				};
			}),
			color: palette.color(),
			name: data.result.map(function(a) {
				return a.value[n][key];
			})[0]
		};
	});

	return {
		series: series,
		stack: true,
		xaxis: 'Time'
	};
};
