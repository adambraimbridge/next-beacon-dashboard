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
		return	(resultObject['meta.componentPos'] === 1 && resultObject['meta.domPath'][0] === 'lead-today') ||
				(resultObject['meta.componentPos'] === 2 && resultObject['meta.domPath'][0] === 'editors-picks') ||
				(resultObject['meta.componentPos'] === 3 && resultObject['meta.domPath'][0] === 'opinion') ||
				(resultObject['meta.componentPos'] === 4 && resultObject['meta.domPath'][0] === 'topic-life-arts') ||
				(resultObject['meta.componentPos'] === 5 && resultObject['meta.domPath'][0] === 'topic-markets') ||
				(resultObject['meta.componentPos'] === 6 && resultObject['meta.domPath'][0] === 'topic-technology') ||
				(resultObject['meta.componentPos'] === 7 && resultObject['meta.domPath'][0] === 'video-picks')
	}

	client.run(scrollDepthQuery, (err, results) => {
		const total = acquireTotal(results);
		const result = results.result.filter(controlFilter).map(result => {
			result['meta.domPath'] = result['meta.domPath'][0];
			result['result'] = calculatePercentage(result, total);
			return result;
		}).sort((a,b) => {
			return parseFloat(a['meta.componentPos']) - parseFloat(b['meta.componentPos']);
		});

		scrollDepthChart
			.data({ result })
			.labels(['Lead today [1]', 'Editor\'s pick [2]', 'Opinion [3]', 'Life & Arts [4]', 'Markets [5]', 'Technology [6]', 'Video [7]'])
			.render();
	});
};

module.exports = {
	render
};
