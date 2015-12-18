/* global Keen */
import queryString from 'querystring';
import client from '../../lib/wrapped-keen';

const queryParams = Object.assign(
	{
		days: 28,
		deviceType: 'all'
	},
	queryString.parse(location.search.substr(1))
);

const createFilter = (operator, property_name, property_value) => ({ operator, property_name, property_value });

const render = () => {
	document.querySelector(`input[name="deviceType"][value="${queryParams.deviceType}"`)
		.setAttribute('checked', 'checked');

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

	const filters = [
		createFilter('exists', 'ingest.context.timings.marks.fontsLoaded', true),
		createFilter('eq', 'page.location.type', 'frontpage')
	];

	if (queryParams.deviceType && queryParams.deviceType !== 'all') {
		filters.push(createFilter('eq', 'deviceAtlas.primaryHardwareType', queryParams.deviceType))
	}

	const keenQuery = new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.marks.fontsLoaded',
		timeframe: `this_${queryParams.days}_days`,
		group_by: 'ab.frontPageLayoutPrototype',
		timezone: 'UTC',
		interval: 'daily',
		filters
	});

	client.run(keenQuery, (err, results) => {
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
