/* global google, $ */

'use strict';


module.exports = function drawGraph(data, metricConfig) {

	const graphData = data.map((day => ({
		timeframe: day[0].timeframe,
		value: day.map(line => ({
			category: `${line.component} (${line.layout})`,
			result: line[metricConfig.id]
		}))
	})));

	metricConfig.chartEl
		.chartOptions({
			series: {
				0: {
					lineWidth: 4,
					color: '#000000'
				}
			}
		})
		.parseRawData( { result: graphData})
		.render();
};
