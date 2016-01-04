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

	const filters = [
		createFilter('eq', 'page.location.type', 'frontpage')
	];

	if (queryParams.deviceType && queryParams.deviceType !== 'all') {
		filters.push(createFilter('eq', 'deviceAtlas.primaryHardwareType', queryParams.deviceType))
	}

	const graphs = [
		{
			el: document.querySelector('#first-paint-chart'),
			title: 'Page starts to render',
			filters: filters.concat([createFilter('exists', 'ingest.context.timings.custom.firstPaint', true)]),
			targetProperty: 'ingest.context.timings.custom.firstPaint'
		},
		{
			el: document.querySelector('#fonts-loaded-chart'),
			title: 'Fonts loaded',
			filters: filters.concat([createFilter('exists', 'ingest.context.timings.marks.fontsLoaded', true)]),
			targetProperty: 'ingest.context.timings.marks.fontsLoaded'
		},
		{
			el: document.querySelector('#page-loaded'),
			title: 'Page loaded (offset from domLoading, i.e. doesn\'t include connection latency)',
			filters: filters.concat([createFilter('exists', 'ingest.context.timings.domLoadingOffset.loadEventEnd', true)]),
			targetProperty: 'ingest.context.timings.domLoadingOffset.loadEventEnd'
		}
	]
		.map(graph => {
			const chart = new Keen.Dataviz()
				.el(graph.el)
				.chartType('areachart')
				.height(450)
				.title(graph.title)
				.labelMapping({
					control: 'Control',
					variant: 'Variant',
					'null': 'Not in test'
				})
				.chartOptions({
					vAxis: {
						format: '#.##s'
					},
					hAxis: {
						format: 'EEE, d	MMM'
					}
				})
				.prepare();
			const query = new Keen.Query('median', {
				eventCollection: 'timing',
				targetProperty: graph.targetProperty,
				timeframe: `this_${queryParams.days}_days`,
				group_by: 'ab.frontPageLayoutPrototype',
				timezone: 'UTC',
				interval: 'daily',
				filters: graph.filters
			});
			return Object.assign({}, graph, { chart, query });
		});

	client.run(graphs.map(graph => graph.query), (err, results) => {
		results.forEach((result, index) => {
			// fix units
			const data = result.result.map(result => {
				const value = result.value.map(value => ({
					name: value['ab.frontPageLayoutPrototype'],
					result: value.result ? (value.result / 1000).toFixed(2) : null
				}));
				return {
					value,
					timeframe: result.timeframe
				}
			});
			graphs[index].chart
				.data({ result: data })
				.render();
		});
	});
};

export default {
	render
}
