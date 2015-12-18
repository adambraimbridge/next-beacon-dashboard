/* global Keen */
import client from '../../lib/wrapped-keen';

const capitalise = s => s.substring(0, 1).toUpperCase() + s.substring(1);

const render = () => {

	const perforamnceChart = new Keen.Dataviz()
		.el(document.querySelector('#performance-chart'))
		.chartType('areachart')
		.height(450)
		.title('Fonts Loaded')
		.labelMapping({
			control: 'Control',
			variant: 'Variant',
			'null': 'Not in test'
		})
		.chartOptions({
			vAxis: {
				format: '#s'
			},
			hAxis: {
				format: 'EEE, d	MMM'
			}
		})
		.prepare();

	const query = new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.marks.fontsLoaded',
		timeframe: `this_28_days`,
		group_by: 'ab.frontPageLayoutPrototype',
		timezone: 'UTC',
		interval: 'daily'
	});

	client.run(query, (err, results) => {
		// fix labels and units
		const result = results.result.map(result => {
			const value = result.value.map(value => ({
				name: value['ab.frontPageLayoutPrototype'],
				result: value.result ? (value.result / 1000).toFixed(2) : null
			}));
			return {
				value,
				timeframe: result.timeframe
			}
		});
		perforamnceChart
			.data({ result })
			.render();
	});
};

export default {
	render
}
