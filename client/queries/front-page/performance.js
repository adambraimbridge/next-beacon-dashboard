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

	// general page performance graph
	const pageLoadingChart = new Keen.Dataviz()
		.el(document.querySelector('#page-loading-events'))
		.chartType('areachart')
		.height(450)
		.title('Page Loading Events')
		.chartOptions({
			vAxis: {
				format: '#.##s'
			},
			hAxis: {
				format: 'EEE, d	MMM'
			},
			trendlines: {
				0: { type: 'polynomial', degree: 2 },
				1: { type: 'polynomial', degree: 2 },
				2: { type: 'polynomial', degree: 2 },
				3: { type: 'polynomial', degree: 2 }
			}
		})
		.prepare();
	const pageLoadingQueries = ['domInteractive', 'domContentLoadedEventStart', 'domComplete', 'loadEventStart']
		.map(eventName => (
			new Keen.Query('median', {
				eventCollection: 'timing',
				targetProperty: `ingest.context.timings.offset.${eventName}`,
				timeframe: `this_${queryParams.days}_days`,
				timezone: 'UTC',
				interval: 'daily',
				filters
			})
		));
	client.run(pageLoadingQueries, (err, results) => {
		const [
			domInteractiveResults,
			domContentLoadedResults,
			domCompleteResults,
			loadEventResults
		] = results;

		// munge the data into a single object
		const pageLoadingResults = domInteractiveResults.result.map((domInteractiveResult, index) => {
			const values = [
				{
					name: 'loadEventStart',
					result: loadEventResults.result[index].value / 1000
				},
				{
					name: 'domComplete',
					result: domCompleteResults.result[index].value / 1000
				},
				{
					name: 'domContentLoadedEventStart',
					result: domContentLoadedResults.result[index].value / 1000
				},
				{
					name: 'domInteractive',
					result: domInteractiveResult.value / 1000
				}
			];
			return {
				timeframe: domInteractiveResult.timeframe,
				value: values
			}
		});

		pageLoadingChart
			.data({ result: pageLoadingResults })
			.render();
	});

	// config for the graphs
	[
		{
			el: document.querySelector('#page-loaded'),
			title: 'Page loaded (offset from domLoading, i.e. doesn\'t include connection latency)',
			filters: filters.concat([createFilter('exists', 'ingest.context.timings.domLoadingOffset.loadEventEnd', true)]),
			targetProperty: 'ingest.context.timings.domLoadingOffset.loadEventEnd'
		},
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
					},
					trendlines: {
						0: { type: 'polynomial', degree: 2 },
						1: { type: 'polynomial', degree: 2 },
						2: { type: 'polynomial', degree: 2 }
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

			client.run(query, (err, result) => {
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
				chart
					.data({ result: data })
					.render();
			});
		});
};

export default {
	render
}
