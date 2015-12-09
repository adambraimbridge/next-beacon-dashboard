/* global Keen */
'use strict';

var client = require('../../lib/wrapped-keen');

var render = () => {
	const scrollDepthChart = new Keen.Dataviz()
		.chartType('columnchart')
		.el(document.getElementById('charts'))
		.height(450)
		.chartOptions({
			isStacked: true
		})
		.prepare();

	var scrollDepthQuery = new Keen.Query('count', {
		eventCollection: 'scrolldepth',
		filters: [
			{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'frontpage'
			},
			{
				operator: 'exists',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: true
			},
			{
				operator: 'eq',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: 'control'
			},
			{
				operator: 'exists',
				property_name: 'meta.domPath',
				property_value: true
			}
		],
		groupBy: ['meta.componentPos', 'meta.domPath'],
		timeframe: 'previous_14_days',
		timezone: 'UTC'
	});

	const acquireTotal = (results) => {
		const leadTodayObject = results.result.filter((resultObject) => {
			return (resultObject['meta.componentPos'] === 1 && resultObject['meta.domPath'][0] === 'lead-today')
		});
		return leadTodayObject ? leadTodayObject[0]['result'] : null
	}

	const calculatePercentage = (result, total) => {
		return (100 / total) * result['result'];
	}

	const controlFilter = (resultObject) => {
		const controlFilterPaths = ['lead-today', 'editors-picks', 'opinion', 'topic-life-arts', 'topic-markets', 'topic-technology', 'video-picks']
		return controlFilterPaths[resultObject['meta.componentPos'] - 1] === resultObject['meta.domPath'][0]
	}

	client.run(scrollDepthQuery, (err, results) => {
		const total = acquireTotal(results);
		const result = results.result.filter(controlFilter).sort((a,b) => {
			return parseFloat(a['meta.componentPos']) - parseFloat(b['meta.componentPos']);
		}).map(result => {
			result['result'] = calculatePercentage(result, total);
			result['meta.componentPos'] = result['meta.domPath'][0] + ' [' + result['meta.componentPos'] + ']';
			return result;
		});

		scrollDepthChart
			.data({ result })
			.render();
	});
};

module.exports = {
	render
};
