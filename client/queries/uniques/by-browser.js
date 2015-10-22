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
const query =  new Keen.Query('count', {
	eventCollection: 'dwell',
	group_by: ['ua.browser.name', 'ua.browser.version'],
	filters,
	timeframe,
	timezone: 'UTC'
});

const toggleBrowserTable = ev => {
	const browserEl = ev.srcElement.parentNode;
	if (!browserEl.classList.contains('table__body-row')) {
		return true;
	}
	const browserName = browserEl.querySelector('.browser-name').textContent;
	[...document.querySelectorAll('.browser-wrapper .table:not(.table--hide)')]
		.forEach(table => table.classList.add('table--hide'));
	document.querySelector(`.browser-wrapper [data-browser-name="${browserName}"]`)
		.classList.remove('table--hide');
};

const buildBrowsersTable = (browsersData, totalCount) => {
	const tableContent = Object.keys(browsersData)
		.map(browserName => ({
			name: browserName,
			count: browsersData[browserName].count
		}))
		.sort((browserOne, browserTwo) => browserTwo.count - browserOne.count)
		.map(browser => {
			const percentage = (100 / totalCount) * browser.count;
			return `
				<tr class="table__body-row">
					<td class="browser-name">${browser.name}</td>
					<td>${browser.count}</td>
					<td>${percentage.toFixed(2)}</td>
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
	tableEl.addEventListener('click', toggleBrowserTable);

	document.querySelector('.browsers')
		.appendChild(tableEl);
};

const buildBrowserTable = (browserName, browserData, totalCount) => {
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
				<tr class="table__body-row">
					<td>${version.name}</td>
					<td>${version.count}</td>
					<td>${percentage.toFixed(2)}</td>
					<td>${totalPercentage.toFixed(2)}</td>
				</tr>`;
		})
		.join('');

	const tableEl = document.createElement('table');
	tableEl.className = 'table table--show-all table--browser table--hide';
	tableEl.dataset.browserName = browserName;
	tableEl.innerHTML = `
		<thead>
			<tr>
				<th>${browserName} Versions</th>
				<th>Count</th>
				<th>%</th>
				<th>Total %</th>
			</tr>
		</thead>
		<tbody>
			${tableContent}
		</tbody>`;

	document.querySelector('.browser-wrapper')
		.appendChild(tableEl);
};

const render = () => {
	client.run(query, (err, { result }) => {
		// pull out the unique browsers, with their counts
		const browsersData = {};
		result.forEach(data => {
			const browserName = data['ua.browser.name'];
			const browserVersion = data['ua.browser.version'];
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
		const totalCount = Object.keys(browsersData).reduce((currentTotal, browserName) => currentTotal + browsersData[browserName].count, 0);
		buildBrowsersTable(browsersData, totalCount);
		Object.keys(browsersData).forEach(browserName => buildBrowserTable(browserName, browsersData[browserName], totalCount));

	});
};

export default {
	render
}
