import queryString from 'querystring';

import client from '../lib/wrapped-keen';

const render = () => {
	const queryParameters = queryString.parse(location.search.substr(1));
	const selectedDays = queryParameters.days || '28';
	const selectedBrowserName = queryParameters.browserName || 'All';
	const selectedBrowserVersion = queryParameters.browserVersion || 'All';
	const selectedPageType = queryParameters.pageType || 'all';
	const selectedDeviceType = queryParameters.deviceType || 'all';

	const filters = [];
	if (selectedBrowserName !== 'All') {
		filters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.browserName',
			property_value: selectedBrowserName
		})
	}
	if (selectedBrowserVersion !== 'All') {
		filters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.browserVersion',
			property_value: selectedBrowserVersion
		})
	}
	if (selectedPageType !== 'all') {
		filters.push({
			operator: 'eq',
			property_name: 'page.location.type',
			property_value: selectedPageType
		})
	}
	if (selectedDeviceType !== 'all') {
		filters.push({
			operator: 'eq',
			property_name: 'deviceAtlas.primaryHardwareType',
			property_value: selectedDeviceType
		})
	}

	document.querySelector(`#days-${selectedDays}`).setAttribute('checked', 'checked');
	document.querySelector(`#page-type-${selectedPageType}`).setAttribute('checked', 'checked');
	document.querySelector(`#device-type-${selectedDeviceType}`).setAttribute('checked', 'checked');

	const perforamnceChart = new Keen.Dataviz()
		.el(document.querySelector('#perforamnce-chart'))
		.chartType('linechart')
		.height(450)
		.title('DOM and CSSDOM finished (domContentLoadedEventStart)')
		.prepare();

	const queries = [];
	queries.push(new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.domContentLoadedEventStart',
		timeframe: `this_${selectedDays}_days`,
		interval: 'daily',
		filters,
		timezone: 'UTC'
	}));

	// pull out all the potential browsers
	queries.push(new Keen.Query('select_unique', {
		eventCollection: 'timing',
		targetProperty: 'deviceAtlas.browserName',
		timeframe: `this_${selectedDays}_days`,
		filters: [
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
		],
		timezone: 'UTC'
	}));

	// if we selected a browser, pull out the versions too
	if (selectedBrowserName !== 'All') {
		queries.push(new Keen.Query('select_unique', {
			eventCollection: 'timing',
			targetProperty: 'deviceAtlas.browserVersion',
			timeframe: `this_${selectedDays}_days`,
			filters: [
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
					property_value: selectedBrowserName
				}
			],
			timezone: 'UTC'
		}));
	}

	client.run(queries, (err, [performanceResults, browserNameResults, browserVersionResults]) => {
		// create the dropdown
		const browserNamesEl = ['All'].concat(browserNameResults.result)
			.map(browserName => (
				browserName === selectedBrowserName ?
					`<option selected>${browserName}</option>` :
					`<option>${browserName}</option>`
			))
			.join('');
		document.querySelector('#browserNames').innerHTML = browserNamesEl;

		if (browserVersionResults) {
			const browserVersionsEl = ['All'].concat(browserVersionResults.result)
				.map(browserVersion => (
					browserVersion === selectedBrowserVersion ?
						`<option selected>${browserVersion}</option>` :
						`<option>${browserVersion}</option>`
				))
				.join('');
			document.querySelector('#browserVersions').innerHTML = browserVersionsEl;
		}

		perforamnceChart
			.data(performanceResults)
			.render();
	});
};

export default {
	render
}
