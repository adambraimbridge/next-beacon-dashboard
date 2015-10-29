/* global Keen */

"use strict";

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

const filters = [{
	operator: 'exists',
	property_name: 'ua.browser.name',
	property_value: true
}];
if (device !== 'all') {
	filters.push({
		operator: 'eq',
		property_name: 'deviceAtlas.mobileDevice',
		property_value: device === 'mobile'

	});
}
const query = new Keen.Query('count', {
	eventCollection: 'dwell',
	group_by: ['ua.browser.name', 'ua.browser.major'],
	filters,
	timeframe,
	timezone: 'UTC'
});

const render = () => {
	client.run(query, (err, { result }) => {
		// group browsers
		const browsersData = {};
		result.forEach(data => {
			const browserName = data['ua.browser.name'];
			const browserVersion = data['ua.browser.major'];
			const count = data.result;
			if (!(browserName in browsersData)) {
				browsersData[browserName] = {
					count: 0,
					versions: {}
				};
			}
			browsersData[browserName].count += count;
			browsersData[browserName].versions[browserVersion] = count;
		});
		buildBrowsersTable(browsersData);

	});
};

const buildBrowsersTable = browsersData => {
	const totalCount = Object.keys(browsersData).reduce((currentTotal, browserName) => currentTotal + browsersData[browserName].count, 0);
	const tableContent = Object.keys(browsersData)
		.map(browserName => ({
			name: browserName,
			count: browsersData[browserName].count,
			versions: browsersData[browserName].versions
		}))
		.sort((browserOne, browserTwo) => browserTwo.count - browserOne.count)
		.map(browser => {
			const percentage = (100 / totalCount) * browser.count;
			const versions = buildBrowserTable(browser, totalCount);
			return `
				<tr class="browser table__body-row">
					<td class="browser__name">${browser.name}</td>
					<td class="browser__percentage" title="${browser.count}">${percentage.toFixed(2)}</td>
					<td class="browser__versions">${versions}</td>
				</tr>`;
		})
		.join('');

	const tableEl = document.createElement('table');
	tableEl.className = 'table table--hover table--show-all table--browsers';
	tableEl.innerHTML = `
		<thead>
			<tr>
				<th>Browser</th>
				<th>%</th>
				<th>Versions</th>
			</tr>
		</thead>
		<tbody>
			${tableContent}
		</tbody>`;
	tableEl.addEventListener('click', toggleBrowserTable);

	document.querySelector('.browsers')
		.appendChild(tableEl);
};

const buildBrowserTable = (browserData, totalCount) => {
	const tableContent = Object.keys(browserData.versions)
		.map(versionName => ({
			name: versionName,
			count: browserData.versions[versionName]
		}))
		.sort((versionOne, versionTwo) => versionTwo.count - versionOne.count)
		.map(version => {
			const percentage = (100 / browserData.count) * version.count;
			const totalPercentage = (100 / totalCount) * version.count;
			return `
				<tr class="version table__body-row">
					<td class="version__name">${version.name}</td>
					<td class="version__percentage" title="${version.count}">${percentage.toFixed(2)}</td>
					<td class="version__total-percentage">${totalPercentage.toFixed(2)}</td>
				</tr>`;
		})
		.join('');

	const tableEl = document.createElement('table');
	tableEl.className = 'table table--show-all table--versions';
	tableEl.dataset.browserName = browserData.name;
	tableEl.innerHTML = `
		<thead>
			<tr>
				<th></th>
				<th>%</th>
				<th>Total %</th>
			</tr>
		</thead>
		<tbody>
			${tableContent}
		</tbody>`;

	return tableEl.outerHTML;
};

const toggleBrowserTable = ev => {
	const browserEl = ev.srcElement.parentNode;
	if (!browserEl.classList.contains('browser')) {
		return true;
	}
	if (browserEl.classList.contains('browser--selected')) {
		browserEl.classList.remove('browser--selected');
	} else {
		[...document.querySelectorAll('.browser--selected')]
			.forEach(table => table.classList.remove('browser--selected'));
		browserEl.classList.add('browser--selected');
	}
};

export default {
	render
};
