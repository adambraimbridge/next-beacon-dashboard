/* global Keen */
import queryString from 'querystring';
import client from '../../lib/wrapped-keen';

const queryParams = Object.assign(
	{
		days: 28,
		deviceType: 'all',
		connectionType: 'all'
	},
	queryString.parse(location.search.substr(1))
);

const createFilter = (property_name, operator, property_value) => ({ property_name, operator, property_value });

// NOTE: handling the older spec for connection type (http://davidbcalhoun.com/2010/using-navigator-connection-android/)
const connectionTypes = {
	cellular: ['cellular', 3, 4],
	wifi: ['wifi', 2],
	ethernet: ['ethernet', 1]
};

const browserLoad = (filters, domLoadingOffset) => {
	const targetProperty = `ingest.context.timings.${domLoadingOffset ? 'domLoadingOffset' : 'offset'}.loadEventEnd`;
	const chart = new Keen.Dataviz()
		.el(document.querySelector('#browsers-load'))
		.chartType('barchart')
		.height(450)
		.title('Average load times over the past 7 days')
		.chartOptions({
			hAxis: {
				format: '#.##s'
			},
			legend: { position: 'none' }
		})
		.prepare();
	const query = new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty,
		timeframe: 'previous_7_days',
		timezone: 'UTC',
		groupBy: 'deviceAtlas.browserName',
		filters: [
			createFilter('deviceAtlas.browserName', 'exists', true),
			createFilter('deviceAtlas.browserName', 'ne', false),
			createFilter(targetProperty, 'exists', true),
			...filters
		]
	});
	client.run(query, (err, results) => {
		const browserTimes = results.result
			// order the browsers by speed
			.sort((resultOne, resultTwo) => resultOne.result - resultTwo.result)
			// units in secs
			.map(result => Object.assign(result, { result: result.result / 1000 }));
		chart
			.data({ result: browserTimes })
			.render();
	});
};

const customMetrics = (filters, domLoadingOffset) => {
	const firstPaintTargetProperty = `ingest.context.timings.${domLoadingOffset ? 'domLoadingOffset' : 'custom'}.firstPaint`;
	const fontsLoadedTargetProperty = `ingest.context.timings.${domLoadingOffset ? 'domLoadingOffset' : 'marks'}.fontsLoaded`;
	const pageLoadedTargetProperty = `ingest.context.timings.${domLoadingOffset ? 'domLoadingOffset' : 'offset'}.loadEventEnd`;
	[
		{
			el: document.querySelector('#first-paint-chart'),
			title: 'Page starts to render',
			filters: [createFilter(firstPaintTargetProperty, 'exists', true), ...filters],
			targetProperty: firstPaintTargetProperty,
			showBrowsers: true
		},
		{
			el: document.querySelector('#fonts-loaded-chart'),
			title: 'Fonts loaded',
			filters: [createFilter(fontsLoadedTargetProperty, 'exists', true), ...filters],
			targetProperty: fontsLoadedTargetProperty,
			showBrowsers: true
		},
		{
			el: document.querySelector('#page-loaded'),
			title: 'Page loaded',
			filters: [createFilter(pageLoadedTargetProperty, 'exists', true), ...filters],
			targetProperty: pageLoadedTargetProperty
		}
	]
		.map(graph => {
			const chart = new Keen.Dataviz()
				.el(graph.el)
				.chartType('areachart')
				.height(450)
				.title(graph.title + (graph.showBrowsers ? ' (limited browser data, see below)' : ''))
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
						0: { },
						1: { },
						2: { }
					}
				})
				.prepare();
			const queries = [
				new Keen.Query('median', {
					eventCollection: 'timing',
					targetProperty: graph.targetProperty,
					timeframe: `previous_${queryParams.days}_days`,
					group_by: 'ab.frontPageLayoutPrototype',
					timezone: 'UTC',
					interval: 'daily',
					filters: graph.filters
				})
			];
			if (graph.showBrowsers) {
				queries.push(
					new Keen.Query('select_unique', {
						eventCollection: 'timing',
						targetProperty: 'deviceAtlas.browserName',
						timeframe: `previous_${queryParams.days}_days`,
						timezone: 'UTC',
						filters: [
							createFilter('deviceAtlas.browserName', 'exists', true),
							createFilter('deviceAtlas.browserName', 'ne', false),
							...graph.filters
						]
					})
				);
			}

			client.run(queries, (err, results) => {
				// fix units
				const data = (results.length ? results[0] : results).result.map(result => {
					const value = result.value.map(value => ({
						name: value['ab.frontPageLayoutPrototype'],
						result: value.result ? (value.result / 1000).toFixed(3) : null
					}));
					return {
						value,
						timeframe: result.timeframe
					}
				});
				chart
					.data({ result: data })
					.render();
				// add note if we're showing data from a select group of browsers
				if (graph.showBrowsers) {
					const browserInfoEl = document.createElement('p');
					browserInfoEl.innerHTML =
						`<strong>Note:</strong> This metric is not well supported. Subsequently, we're only collecting data from ${results[1].result.join(', ')}`;
					graph.el.appendChild(browserInfoEl);
				}
			});
		});
};

const generalPageLoad = (filters, domLoadingOffset) => {
	const pageLoadingChart = new Keen.Dataviz()
		.el(document.querySelector('#page-loading-events'))
		.chartType('areachart')
		.height(450)
		.title('Page loading events')
		.chartOptions({
			vAxis: {
				format: '#.##s'
			},
			hAxis: {
				format: 'EEE, d	MMM'
			},
			trendlines: {
				0: { },
				1: { },
				2: { },
				3: { }
			}
		})
		.prepare();
	const pageLoadingQueries = ['domInteractive', 'domContentLoadedEventStart', 'domComplete', 'loadEventStart']
		.map(eventName => {
			const targetProperty = `ingest.context.timings.${domLoadingOffset ? 'domLoadingOffset' : 'offset'}.${eventName}`;
			return new Keen.Query('median', {
				eventCollection: 'timing',
				targetProperty,
				timeframe: `previous_${queryParams.days}_days`,
				timezone: 'UTC',
				interval: 'daily',
				filters: [createFilter(targetProperty, 'exists', true), ...filters]
			});
		});
	client.run(pageLoadingQueries, (err, results) => {
		const [domInteractiveResults, domContentLoadedResults, domCompleteResults, loadEventResults] = results;
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
};

const render = () => {
	// select the form values
	document.querySelector(`input[name="deviceType"][value="${queryParams.deviceType}"]`)
		.setAttribute('checked', 'checked');
	document.querySelector(`input[name="connectionType"][value="${queryParams.connectionType}"]`)
		.setAttribute('checked', 'checked');
	if (queryParams.domLoadingOffset) {
		document.querySelector(`input[name="domLoadingOffset"]`)
			.setAttribute('checked', 'checked');
	}

	const filters = [
		createFilter('page.location.type', 'eq', 'frontpage')
	];
	if (queryParams.deviceType && queryParams.deviceType !== 'all') {
		filters.push(createFilter('deviceAtlas.primaryHardwareType', 'eq', queryParams.deviceType))
	}
	if (queryParams.connectionType && queryParams.connectionType !== 'all') {
		filters.push(createFilter('ingest.user.connectionType', 'in', connectionTypes[queryParams.connectionType]))
	}

	browserLoad(filters, queryParams.domLoadingOffset);
	customMetrics(filters, queryParams.domLoadingOffset);
	generalPageLoad(filters, queryParams.domLoadingOffset);
};

export default {
	render
}
