'use strict';

module.exports = function(data, palette, query) {
	var key = query.group_by;

	// First, sort all data by value
	data.result.map(function(a) {
		return {
			timeframe: a.timeframe,
			value: a.value.sort(function(a,b){
				return (a.result > b.result) ? 1 : -1;
			})
		};
	});

	// Use the first interval's data to build a new series array
	var firstinterval = data.result[0].value;
	var series = firstinterval.map(function(a, n) {
		return {
			data: data.result.map(function(a) {

				// Calculate the value as a percentage of total
				for (var i = 0, sum = 0; i < a.value.length; sum += a.value[i++].result){}
				var percentage = sum ? (a.value[n].result/sum)*100 : 0;
				return {
					x: new Date(a.timeframe.start).valueOf() / 1000,
					y: percentage
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
