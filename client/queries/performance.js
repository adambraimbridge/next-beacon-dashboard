import queryString from 'querystring';
import client from '../lib/wrapped-keen';

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

const choicesChange = ev => {
	// get the filters
	const form = document.querySelector('.performance-form');
	disableForm(form);
	const filters = [
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
			return value !== 'all' ?
				{
					operator: 'eq',
					property_name: config.propertyName,
					property_value: value
				} :
				null
		})
		.filter(filter => filter);

	// pull out all the potential browsers
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection: 'timing',
		targetProperty: 'deviceAtlas.browserName',
		timeframe: `this_${form.querySelector('[name="days"]:checked').value}_days`,
		filters: filters.concat([
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
		]),
		timezone: 'UTC'
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
	const filters = [
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
			return value !== 'all' ?
			{
				operator: 'eq',
				property_name: config.propertyName,
				property_value: value
			} :
				null
		})
		.filter(filter => filter);

	// pull out all the potential browsers
	const browserNameQuery = new Keen.Query('select_unique', {
		eventCollection: 'timing',
		targetProperty: 'deviceAtlas.browserVersion',
		timeframe: `this_${form.querySelector('[name="days"]:checked').value}_days`,
		filters: filters.concat([
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
				property_value: form.querySelector('[name="browserName"]').value
			}
		]),
		timezone: 'UTC'
	});

	client.run(browserNameQuery, (err, result) => {
		buildDropDown('browserVersion', result.result.sort(numericalSort), 'All');
		enableForm(form);
	});
};

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

	const queries = ['domInteractive', 'domContentLoadedEventStart', 'domComplete', 'loadEventStart'].map(eventName => (
		new Keen.Query('median', {
			eventCollection: 'timing',
			targetProperty: `ingest.context.timings.offset.${eventName}`,
			timeframe: `this_${query.days}_days`,
			interval: 'daily',
			filters: sharedFilters.concat(filters),
			timezone: 'UTC'
		})
	));

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
