'use strict';


module.exports = function drawGraph(data, metricConfig) {

	const graphData = data.map((day => ({
		timeframe: day.timeframe,
		value: day[metricConfig.id]
	})));

	metricConfig.chartEl
		.parseRawData({ result: graphData})
		.render();
};
