import queryString from 'querystring';
import client from '../lib/wrapped-keen';

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

// default keen query params
const eventCollection = 'timing';
const timezone = 'UTC';
const interval = 'daily';
const timeframe = `this_${query.days}_days`;

const numericalSort = (a, b) => parseFloat(b) - parseFloat(a);

const buildDropDown = (type, options, selected) => {
	document.querySelector(`#${type}s`).innerHTML = ['All'].concat(options)
		.map(option => option === selected ? `<option selected>${option}</option>` : `<option>${option}</option>`)
		.join('');
};

const disableForm = form => {
	[...form.querySelectorAll('input, select')].forEach(el => el.setAttribute('disabled', 'disabled'));
};

const enableForm = form => {
	[...form.querySelectorAll('input, select')].forEach(el => el.removeAttribute('disabled'));
};

const createFilter = (operator, property_name, property_value) => ({ operator, property_name, property_value });

const getFilters = form => (
	[
		{
			name: 'pageType',
			propertyName: 'page.location.type'
		},
		{
			name: 'deviceType',
			propertyName: 'deviceAtlas.primaryHardwareType'
		},
		{
			name: 'abTest',
			propertyName: 'ab.frontPageLayoutPrototype'
		}
	]
		.map(config => {
			const value = form.querySelector(`[name="${config.name}"]:checked`).value;
			return value !== 'all' ? createFilter('eq', config.propertyName, value) : null;
		})
		.filter(filter => filter)
);

const choicesChange = ev => {
	// get the filters
	const form = document.querySelector('.performance-form');
	disableForm(form);
	const filters = getFilters(form);

	// pull out all the potential browsers
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection,
		targetProperty: 'deviceAtlas.browserName',
		timeframe: `this_${form.querySelector('[name="days"]:checked').value}_days`,
		filters: filters.concat([
			createFilter('exists', 'deviceAtlas.browserName', true),
			createFilter('ne', 'deviceAtlas.browserName', false)
		]),
		timezone
	});

	client.run(browserNameQuery, (err, result) => {
		buildDropDown('browserName', result.result, 'All');
		buildDropDown('browserVersion', [], 'All');
		enableForm(form);
	});
};

const browserChange = ev => {
	// get the filters
	const form = document.querySelector('.performance-form');
	const browserName = form.querySelector('[name="browserName"]').value;
	if (browserName === 'All') {
		form.querySelector('[name="browserVersion"]').innerHTML = '<option selected>All</option>';
		return;
	}
	disableForm(form);
	const filters = getFilters(form);

	// pull out all the potential browsers
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection,
		targetProperty: 'deviceAtlas.browserVersion',
		timeframe: `this_${form.querySelector('[name="days"]:checked').value}_days`,
		filters: filters.concat([
			createFilter('exists', 'deviceAtlas.browserVersion', true),
			createFilter('ne', 'deviceAtlas.browserVersion', false),
			createFilter('eq', 'deviceAtlas.browserName', form.querySelector('[name="browserName"]').value)
		]),
		timezone
	});

	client.run(browserNameQuery, (err, result) => {
		buildDropDown('browserVersion', result.result.sort(numericalSort), 'All');
		enableForm(form);
	});
};

const render = () => {
	const sharedFilters = [
		createFilter('exists', 'deviceAtlas.browserName', true),
		createFilter('ne', 'deviceAtlas.browserName', false)
	];
	if (query.pageType !== 'all') {
		sharedFilters.push(createFilter('eq', 'page.location.type', query.pageType));
	}
	if (query.deviceType !== 'all') {
		sharedFilters.push(createFilter('eq', 'deviceAtlas.primaryHardwareType', query.deviceType));
	}
	if (query.abTest !== 'all') {
		sharedFilters.push(createFilter('eq', 'ab.frontPageLayoutPrototype', query.abTest));
	}

	// update the radio button filters
	['days', 'pageType', 'deviceType', 'abTest'].forEach(name => (
		document.querySelector(`input[name="${name}"][value="${query[name]}"`)
			.setAttribute('checked', 'checked')
	));
	// update drop down filters
	['browserName', 'browserVersion'].forEach(name => (
		document.querySelector(`select[name="${name}"]`).innerHTML = `<option selected>${query[name]}</option>`
	));

	const perforamnceChart = new Keen.Dataviz()
		.el(document.querySelector('#perforamnce-chart'))
		.chartType('areachart')
		.height(450)
		.title('Page Loading Events')
		.prepare();


	const filters = [];
	if (query.browserName !== 'All') {
		filters.push(createFilter('eq', 'deviceAtlas.browserName', query.browserName));
	}
	if (query.browserVersion !== 'All') {
		filters.push(createFilter('eq', 'deviceAtlas.browserVersion', query.browserVersion));
	}
	const queries = ['domInteractive', 'domContentLoadedEventStart', 'domComplete', 'loadEventStart'].map(eventName => (
		new Keen.Query('median', {
			eventCollection,
			targetProperty: `ingest.context.timings.offset.${eventName}`,
			timeframe,
			interval,
			filters: sharedFilters.concat(filters),
			timezone
		})
	));

	// pull out all the potential browsers
	queries.push(new Keen.Query('select_unique', {
		eventCollection,
		targetProperty: 'deviceAtlas.browserName',
		timeframe,
		filters: sharedFilters,
		timezone
	}));

	// if we selected a browser, pull out the versions too
	if (query.browserName !== 'All') {
		queries.push(new Keen.Query('select_unique', {
			eventCollection,
			targetProperty: 'deviceAtlas.browserVersion',
			timeframe,
			filters: sharedFilters.concat([
				createFilter('exists', 'deviceAtlas.browserVersion', true),
				createFilter('ne', 'deviceAtlas.browserVersion', false),
				createFilter('eq', 'deviceAtlas.browserName', query.browserName)
			]),
			timezone
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

		// create the dropdowns
		buildDropDown('browserName', browserNameResults.result, query.browserName);
		if (browserVersionResults) {
			buildDropDown('browserVersion', browserVersionResults.result.sort(numericalSort), query.browserVersion);
		}
		// handle form changing
		document.querySelector('.performance-form__choices').addEventListener('change', choicesChange);
		document.querySelector('.performance-form__browser-names').addEventListener('change', browserChange);

		// munge the data into a single object
		const performanceResults = domInteractiveResults.result.map((domInteractiveResult, index) => {
			const values = [
				{
					name: 'loadEventStart',
					result: loadEventResults.result[index].value
				},
				{
					name: 'domComplete',
					result: domCompleteResults.result[index].value
				},
				{
					name: 'domContentLoadedEventStart',
					result: domContentLoadedResults.result[index].value
				},
				{
					name: 'domInteractive',
					result: domInteractiveResult.value
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
