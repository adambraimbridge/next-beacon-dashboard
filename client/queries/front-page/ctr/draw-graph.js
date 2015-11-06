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

	const series = {};

	if(data[0][0].component === 'all' & data[0][0].layout === 'all') {
		series[0] =  {
			lineWidth: 4,
			color: '#000000'
		}
	}

	metricConfig.chartEl
		.chartOptions({
			series: series
		})
		.parseRawData( { result: graphData})
		.render();
};
