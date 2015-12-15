import queryString from 'querystring';

import client from '../lib/wrapped-keen';

const render = () => {
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection: 'timing',
		targetProperty: 'ua.browser.name',
		timeframe: `this_7_days`,
		filters: [{
			operator: 'exists',
			property_name: 'ua.browser.name',
			property_value: true
		}],
		timezone: 'UTC'
	});

	const filters = [];
	const queryParameters = queryString.parse(location.search.substr(1));
	if (queryParameters.browserName) {
		filters.push({
			operator: 'ne',
			property_name: 'ua.browser.name',
			property_value: queryParameters.browserName
		})
	}

	const perforamnceChart = new Keen.Dataviz()
		.el(document.querySelector('#perforamnce-chart'))
		.chartType('linechart')
		.height(450)
		.title('DOM and CSSDOM finished (domContentLoadedEventStart)')
		.prepare();

	const perforamnceQuery = new Keen.Query('median', {
		eventCollection: 'timing',
		targetProperty: 'ingest.context.timings.offset.domContentLoadedEventStart',
		timeframe: `this_7_days`,
		interval: 'daily',
		filters,
		timezone: 'UTC'
	});

	client.run([browserNameQuery, perforamnceQuery], (err, [browserNameResults, performanceResults]) => {
		console.log(browserNameResults);
		console.log(performanceResults);
		// create the dropdown
		const browsersEl = browserNameResults.result
			.map(browser => `<option>${browser}</option>`)
			.join('');
		document.querySelector('#browsers').innerHTML = browsersEl;

		perforamnceChart
			.data(performanceResults)
			.render();
	});
};

export default {
	render
}
