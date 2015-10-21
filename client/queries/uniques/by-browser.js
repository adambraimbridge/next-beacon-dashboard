import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search.substr(1));
const timeframe = queryParameters.timeframe || 'this_14_days';

const linkEl = document.querySelector(`*[href="?timeframe=${timeframe}"]`);
linkEl.outerHTML = linkEl.textContent;

const render = () => {
	const browsersQuery = new Keen.Query('count_unique', {
		eventCollection: 'dwell',
		group_by: 'deviceAtlas.browserName',
		target_property: 'ingest.device.spoor_id',
		filters: [
			{
				operator: 'ne',
				property_name: 'deviceAtlas.browserName',
				property_value: false
			},
			{
				operator: 'exists',
				property_name: 'deviceAtlas.browserName',
				property_value: true
			}
		],
		timeframe: 'this_1_days',
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
						<td class="table__body-row__browser-name">${browserData['deviceAtlas.browserName']}</td>
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
					const browserQuery = new Keen.Query('count_unique', {
						eventCollection: 'dwell',
						group_by: 'deviceAtlas.browserVersion',
						target_property: 'ingest.device.spoor_id',
						filters: [
							{
								operator: 'eq',
								property_name: 'deviceAtlas.browserName',
								property_value: browserName
							}
						],
						timeframe: 'this_1_days',
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
										<td class="table__body-row__browser-version">${browserData['deviceAtlas.browserVersion']}</td>
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
