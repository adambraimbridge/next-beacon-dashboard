import queryString from 'querystring';

import client from '../lib/wrapped-keen';

const sort = (a, b) => parseFloat(b) - parseFloat(a);

const render = () => {
	const query = Object.assign(
		{
			days: 28,
			browserName: 'All',
			browserVersion: 'All',
			pageType: 'all',
			deviceType: 'all',
			abTest: 'all'
		},
		queryString.parse(location.search.substr(1))
	);

	const sharedFilters = [
		{
			operator: 'exists',
			property_name: 'deviceAtlas.browserName',
			property_value: true
		},
		{
			operator: 'ne',
			property_name: 'deviceAtlas.browserName',
			property_value: false
		}
	];
	if (query.pageType !== 'all') {
		sharedFilters.push({
			operator: 'eq',
			property_name: 'page.location.type',
			property_value: query.pageType
		})
	}
	if (query.deviceType !== 'all') {
		sharedFilters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.primaryHardwareType',
			property_value: query.deviceType
		})
	}
	if (query.abTest !== 'all') {
		sharedFilters.push({
			operator: 'eq',
			property_name: 'ab.frontPageLayoutPrototype',
			property_value: query.abTest
		})
	}

	const filters = [];
	if (query.browserName !== 'All') {
		filters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.browserName',
			property_value: query.browserName
		})
	}
	if (query.browserVersion !== 'All') {
		filters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.browserVersion',
			property_value: query.browserVersion
		})
	}

	// update the filters
	['days', 'pageType', 'deviceType', 'abTest'].forEach(filterQueryName => (
		document.querySelector(`input[name="${filterQueryName}"][value="${query[filterQueryName]}"`)
			.setAttribute('checked', 'checked')
	));

	const perforamnceChart = new Keen.Dataviz()
		.el(document.querySelector('#perforamnce-chart'))
		.chartType('areachart')
		.height(450)
		.title('HTML and CSS parsing finished (domContentLoadedEventStart)')
		.prepare();

	const queries = [];
	queries.push(new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.domInteractive',
		timeframe: `this_${query.days}_days`,
		interval: 'daily',
		filters: sharedFilters.concat(filters),
		timezone: 'UTC'
	}));

	queries.push(new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.domContentLoadedEventStart',
		timeframe: `this_${query.days}_days`,
		interval: 'daily',
		filters: sharedFilters.concat(filters),
		timezone: 'UTC'
	}));

	queries.push(new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.domComplete',
		timeframe: `this_${query.days}_days`,
		interval: 'daily',
		filters: sharedFilters.concat(filters),
		timezone: 'UTC'
	}));

	queries.push(new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.loadEventStart',
		timeframe: `this_${query.days}_days`,
		interval: 'daily',
		filters: sharedFilters.concat(filters),
		timezone: 'UTC'
	}));

	// pull out all the potential browsers
	queries.push(new Keen.Query('select_unique', {
		eventCollection: 'timing',
		targetProperty: 'deviceAtlas.browserName',
		timeframe: `this_${query.days}_days`,
		filters: sharedFilters,
		timezone: 'UTC'
	}));

	// if we selected a browser, pull out the versions too
	if (query.browserName !== 'All') {
		queries.push(new Keen.Query('select_unique', {
			eventCollection: 'timing',
			targetProperty: 'deviceAtlas.browserVersion',
			timeframe: `this_${query.days}_days`,
			filters: sharedFilters.concat([
				{
					operator: 'exists',
					property_name: 'deviceAtlas.browserVersion',
					property_value: true
				},
				{
					operator: 'ne',
					property_name: 'deviceAtlas.browserVersion',
					property_value: false
				},
				{
					operator: 'eq',
					property_name: 'deviceAtlas.browserName',
					property_value: query.browserName
				}
			]),
			timezone: 'UTC'
		}));
	}

	client.run(queries, (err, results) => {
		const [
			domInteractiveResults,
			domContentLoadedResults,
			domCompleteResults,
			loadEventResults,
			browserNameResults,
			browserVersionResults
		] = results;
		// create the dropdown
		document.querySelector('#browserNames').innerHTML = ['All'].concat(browserNameResults.result)
			.map(browserName => (
				browserName === query.browserName ?
					`<option selected>${browserName}</option>` :
					`<option>${browserName}</option>`
			))
			.join('');

		if (browserVersionResults) {
			document.querySelector('#browserVersions').innerHTML = ['All'].concat(browserVersionResults.result.sort(sort))
				.map(browserVersion => (
					browserVersion === query.browserVersion ?
						`<option selected>${browserVersion}</option>` :
						`<option>${browserVersion}</option>`
				))
				.join('');
		}

		// munge the data into a single object
		const performanceResults = domInteractiveResults.result.map((domInteractiveResult, index) => {
			const values = [
				{
					name: 'domInteractive',
					result: domInteractiveResult.value
				},
				{
					name: 'domContentLoadedEventStart',
					result: domContentLoadedResults.result[index].value
				},
				{
					name: 'domComplete',
					result: domCompleteResults.result[index].value
				},
				{
					name: 'loadEventStart',
					result: loadEventResults.result[index].value
				}
			];
			return {
				timeframe: domInteractiveResult.timeframe,
				value: values
			}
		});

		perforamnceChart
			.data({ result: performanceResults })
			.render();
	});
};

export default {
	render
}
