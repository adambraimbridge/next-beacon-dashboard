/* global Keen */
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

const disableForm = formEl => {
	[...formEl.querySelectorAll('input, select')].forEach(el => el.setAttribute('disabled', 'disabled'));
};

const enableForm = formEl => {
	[...formEl.querySelectorAll('input, select')].forEach(el => el.removeAttribute('disabled'));
};

const createFilter = (operator, property_name, property_value) => ({ operator, property_name, property_value });

const getFilters = (formEl, name) => {
	// get the radio buttons filters
	let filters = ['days', 'pageType', 'deviceType', 'abTest']
		.reduce((currentFilters, name) => {
			currentFilters[name] = formEl.querySelector(`[name="${name}"]:checked`).value;
			return currentFilters;
		}, {});
	// get the drop down filters
	filters = ['browserName', 'browserVersion']
		.reduce((currentFilters, name) => {
			currentFilters[name] = formEl.querySelector(`[name="${name}"]`).value;
			return currentFilters;
		}, filters);
	return name ? filters[name] : filters;
};

const getRadioOptions= formEl => (
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
			const value = getFilters(formEl, config.name);
			return value !== 'all' ? createFilter('eq', config.propertyName, value) : null;
		})
		.filter(filter => filter)
);

const radioChange = () => {
	// get the filters
	const formEl = document.querySelector('.performance-form');
	disableForm(formEl);
	const filters = getRadioOptions(formEl);

	// pull out all the potential browsers
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection,
		targetProperty: 'deviceAtlas.browserName',
		timeframe: `this_${getFilters(formEl, 'days')}_days`,
		filters: filters.concat([
			createFilter('exists', 'deviceAtlas.browserName', true),
			createFilter('ne', 'deviceAtlas.browserName', false)
		]),
		timezone
	});

	client.run(browserNameQuery, (err, result) => {
		buildDropDown('browserName', result.result, 'All');
		buildDropDown('browserVersion', [], 'All');
		enableForm(formEl);
	});
};

const browserChange = () => {
	// get the filters
	const formEl = document.querySelector('.performance-form');
	const browserName = getFilters(formEl, 'browserName');
	if (browserName === 'All') {
		formEl.querySelector('[name="browserVersion"]').innerHTML = '<option selected>All</option>';
		return;
	}
	disableForm(formEl);
	const filters = getRadioOptions(formEl);

	// pull out all the potential browser versions
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection,
		targetProperty: 'deviceAtlas.browserVersion.major',
		timeframe: `this_${getFilters(formEl, 'days')}_days`,
		filters: filters.concat([
			createFilter('exists', 'deviceAtlas.browserVersion.major', true),
			createFilter('ne', 'deviceAtlas.browserVersion.major', false),
			createFilter('eq', 'deviceAtlas.browserName', getFilters(formEl, 'browserName'))
		]),
		timezone
	});

	client.run(browserNameQuery, (err, result) => {
		buildDropDown('browserVersion', result.result.sort(numericalSort), 'All');
		enableForm(formEl);
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
		.chartOptions({
			vAxis: {
				format: '#.##s'
			},
			hAxis: {
				format: 'EEE, d	MMM'
			}
		})
		.prepare();


	const filters = [];
	if (query.browserName !== 'All') {
		filters.push(createFilter('eq', 'deviceAtlas.browserName', query.browserName));
	}
	if (query.browserVersion !== 'All') {
		filters.push(createFilter('eq', 'deviceAtlas.browserVersion.major', parseInt(query.browserVersion)));
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
			targetProperty: 'deviceAtlas.browserVersion.major',
			timeframe,
			filters: sharedFilters.concat([
				createFilter('exists', 'deviceAtlas.browserVersion.major', true),
				createFilter('ne', 'deviceAtlas.browserVersion.major', false),
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
			buildDropDown('browserVersion', browserVersionResults.result.sort(numericalSort), parseInt(query.browserVersion));
		}
		// handle form changing
		document.querySelector('.performance-form__choices').addEventListener('change', radioChange);
		document.querySelector('.performance-form__browser-names').addEventListener('change', browserChange);

		// munge the data into a single object
		const performanceResults = domInteractiveResults.result.map((domInteractiveResult, index) => {
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

		perforamnceChart
			.data({ result: performanceResults })
			.render();
	});
};

export default {
	render
}
