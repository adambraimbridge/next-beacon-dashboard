import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search.substr(1));
const timeframe = queryParameters.timeframe || 'this_14_days';
const device = queryParameters.device || 'all';

const timeframeLinkEl = document.querySelector(`*[href="?timeframe=${timeframe}"]`);
timeframeLinkEl.outerHTML = timeframeLinkEl.textContent;
const deviceLinkEl = document.querySelector(`*[href="?device=${device}"]`);
deviceLinkEl.outerHTML = deviceLinkEl.textContent;

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
		const tableEl = document.createElement('table');
		tableEl.className = 'table table--hover table--show-all table--browsers';
		const tableContent = result
			.sort((browserDataOne, browserDataTwo) => browserDataTwo.result - browserDataOne.result)
			.map(browserData => {
				const percentage = (100 / totalResult) * browserData.result;
				return `
					<tr class="table__body-row">
						<td class="table__body-row__browser-name">${browserData['ua.browser.name']}</td>
						<td>${browserData.result}</td>
						<td>${percentage.toFixed(2)}</td>
					</tr>`;
			})
			.join('');
		tableEl.innerHTML = `
			<tr>
				<th>Browser</th>
				<th>Count</th>
				<th>%</th>
			</tr>
			${tableContent}
		`;
		document.querySelector('.browser-names')
			.appendChild(tableEl);

		document.querySelector('.table--browsers')
			.addEventListener('click', (ev) => {
				const srcElement = ev.srcElement;
				if (srcElement.parentNode.classList.contains('table__body-row')) {
					const rowEl = srcElement.parentNode;
					const browserName = rowEl.querySelector('.table__body-row__browser-name').textContent;
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
						const browserTotal = rowEl.children[1].textContent;
						const tableEl = document.createElement('table');
						tableEl.className = 'table table--show-all table--browser';
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
									</tr>
								`;
							})
							.join('');
						tableEl.innerHTML = `
							<tr>
								<th>${browserName} Version</th>
								<th>Count</th>
								<th>%</th>
								<th>Total %</th>
							</tr>
							${tableContent}`;
						document.querySelector('.browser').innerHTML = tableEl.outerHTML;
					});
				}
			})
	});
}

export default {
	render
}
