module.exports = function(data, palette, query) {
	var key = query.group_by;
	var series = data.result[0].value.map(function(a, n) {
		return {
			data: data.result.map(function (a) {
				for (var i = 0, sum = 0; i < a.value.length; sum += a.value[i++].result){};
				var percentage = (a.value[n].result/sum)*100;
				return {
					x: new Date(a.timeframe.start).valueOf() / 1000,
					y: percentage
				};
			}),
			color: palette.color(),
			name: data.result.map(function (a) {
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
