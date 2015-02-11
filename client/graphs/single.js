module.exports = function(data, palette, query) {
	var series = [{
		data: data.result.map(function (result) {
			return {
				x: new Date(result.timeframe.start).valueOf() / 1000,
				y: result.value
			};
		}),
		color: palette.color(),
		name: 'interactions'
	}];

	return {
		series: series
	};
};