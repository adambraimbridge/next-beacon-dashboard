import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search.substr(1));
const timeframe = queryParameters.timeframe || 'this_14_days';
const device = queryParameters.device || 'all';

const timeframeLinkEl = document.querySelector(`*[href="?timeframe=${timeframe}"]`);
timeframeLinkEl.outerHTML = timeframeLinkEl.textContent;
const deviceLinkEl = document.querySelector(`*[href="?device=${device}"]`);
if (deviceLinkEl) {
	deviceLinkEl.outerHTML = deviceLinkEl.textContent;
}

const loadBrowserDataHandler = (deviceFilter, totalResult, ev) => {
	const srcElement = ev.srcElement;
	if (document.querySelector('.table__body-row--selected') || !srcElement.parentNode.classList.contains('table__body-row')) {
		return true;
	}

	const rowEl = srcElement.parentNode;
	rowEl.classList.add('table__body-row--selected');
	const browserName = rowEl.querySelector('.browser-name').textContent;
	const browserFilters = [
		{
			operator: 'eq',
			property_name: 'ua.browser.name',
			property_value: browserName
		}
	];
	if (deviceFilter) {
		browserFilters.push(deviceFilter);
	}
	const browserQuery = new Keen.Query('count', {
		eventCollection: 'dwell',
		group_by: 'ua.browser.version',
		filters: browserFilters,
		timeframe,
		timezone: 'UTC'
	});
	client.run(browserQuery, (err, { result }) => {
		const browserTotal = rowEl.querySelector('.browser-count').textContent;
		const tableContent = result
			.sort((browserDataOne, browserDataTwo) => browserDataTwo.result - browserDataOne.result)
			.map(browserData => {
				const percentage = (100 / browserTotal) * browserData.result;
				const totalPercentage = (100 / totalResult) * browserData.result;
				return `
					<tr class="table__body-row">
						<td class="table__body-row__browser-version">${browserData['ua.browser.version']}</td>
						<td>${browserData.result}</td>
						<td>${percentage.toFixed(2)}</td>
						<td>${totalPercentage.toFixed(2)}</td>
					</tr>`;
			})
			.join('');

		const tableEl = document.createElement('table');
		tableEl.className = 'table table--show-all table--browser';
		tableEl.innerHTML = `
			<tr>
				<th>${browserName} Version</th>
				<th>Count</th>
				<th>%</th>
				<th>Total %</th>
			</tr>
			${tableContent}`;
		document.querySelector('.browser').innerHTML = tableEl.outerHTML;
		rowEl.classList.remove('table__body-row--selected');
	});
};

const render = () => {
	const deviceFilter = device === 'all' ?
		null :
		{
			operator: 'eq',
			property_name: 'deviceAtlas.mobileDevice',
			property_value: device === 'mobile'

		};
	const browsersFilters = [
		{
			operator: 'exists',
			property_name: 'ua.browser.name',
			property_value: true
		}
	];
	if (deviceFilter) {
		browsersFilters.push(deviceFilter);
	}
	const browsersQuery = new Keen.Query('count', {
		eventCollection: 'dwell',
		group_by: 'ua.browser.name',
		filters: browsersFilters,
		timeframe,
		timezone: 'UTC'
	});
	client.run(browsersQuery, (err, { result }) => {
		const totalResult = result.reduce((currentTotal, currentBrowserData) => currentTotal + currentBrowserData.result, 0);
		const tableContent = result
			.sort((browserDataOne, browserDataTwo) => browserDataTwo.result - browserDataOne.result)
			.map(browserData => {
				const percentage = (100 / totalResult) * browserData.result;
				return `
					<tr class="table__body-row">
						<td class="browser-name">${browserData['ua.browser.name']}</td>
						<td class="browser-count">${browserData.result}</td>
						<td class="browser-percentage">${percentage.toFixed(2)}</td>
					</tr>`;
			})
			.join('');

		const tableEl = document.createElement('table');
		tableEl.className = 'table table--hover table--show-all table--browsers';
		tableEl.innerHTML = `
			<thead>
				<tr>
					<th>Browser</th>
					<th>Count</th>
					<th>%</th>
				</tr>
			</thead>
			<tbody>
				${tableContent}
			</tbody>`;
		tableEl.addEventListener('click', loadBrowserDataHandler.bind(this, deviceFilter, totalResult));

		document.querySelector('.browser-names')
			.appendChild(tableEl);
	});
}

export default {
	render
}
