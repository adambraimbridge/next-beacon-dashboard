/* global Keen */
'use strict';

const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));

const client = require('../../lib/wrapped-keen');

const breakpoints = ['default', 'XS', 'S', 'M', 'L', 'XL'];
const userTypes = ['subscriber', 'registered', 'anonymous'];
const timeframeTypes = ['7', '14', '21', '28'];

const render = () => {
	const currentUserType = queryParameters['user-type'] || userTypes[0];
	const currentTimeframe = queryParameters['timeframe'] || timeframeTypes[0];
	const el = document.getElementById('charts');

	const scrollDepthEl = document.createElement('div');
	scrollDepthEl.classList.add('o-grid-row');
	scrollDepthEl.innerHTML = `
		<h2 data-o-grid-colspan="12">
			Percentage of page views that see the 1st component, 2nd component, etc
		</h2>
	`;
	el.appendChild(scrollDepthEl);

	const userTypeEl = document.createElement('div');
	userTypeEl.classList.add('nav--horizontal');
	userTypeEl.dataset.oGridColspan = '12';

	const userItems = userTypes
		.map(userType =>
			userType === currentUserType
				? `<li>${userType}</li>`
				: `
					<li>
						<a href="?user-type=${userType}&amp;timeframe=${currentTimeframe}">
							${userType}
						</a>
					</li>
				`
		)
		.join('');

	const timeframeItems = timeframeTypes
		.map(timeframeType =>
			timeframeType === currentTimeframe
				? `<li>${timeframeType}</li>`
				: `
					<li>
						<a href="?user-type=${currentUserType}&amp;timeframe=${timeframeType}">
							${timeframeType}
						</a>
					</li>
				`
		)
		.join('');

	userTypeEl.innerHTML = `
		<h3>User type: </h3>
		<ul>
			${userItems}
		</ul>
		<br>
		<h3>Timeframe (days):</h3>
		<ul>
			${timeframeItems}
		</ul>
	`;
	scrollDepthEl.insertBefore(userTypeEl, scrollDepthEl.firstChild);

	const scrollDepthCharts = {};
	breakpoints.forEach(breakpoint => {
		const graphEl = document.createElement('div');
		graphEl.dataset.oGridColspan = '12';
		graphEl.classList.add('o-tabs__tabpanel');
		graphEl.id = breakpoint;
		scrollDepthEl.appendChild(graphEl);

		scrollDepthCharts[breakpoint] = new Keen.Dataviz()
			.chartType('columnchart')
			.el(graphEl)
			.height(450)
			.chartOptions({
				isStacked: true,
				legend: {
					position: 'none'
				}
			})
			.prepare();
	});

	const filters = [
		{
			operator: 'eq',
			property_name: 'page.location.type',
			property_value: 'frontpage'
		},
		{
			operator: 'exists',
			property_name: 'meta.domPath',
			property_value: true
		},
		{
			operator: 'eq',
			property_name: 'cohort.incumbent',
			property_value: currentUserType
		}
	];


	const scrollDepthQuery = new Keen.Query('count', {
		eventCollection: 'scrolldepth',
		filters: filters,
		groupBy: ['meta.componentPos', 'meta.domPath', 'ingest.user.layout'],
		timeframe: `previous_${currentTimeframe}_days`,
		timezone: 'UTC'
	});

	const acquireTotal = resultObjectArray => {
		const topSectionObject = resultObjectArray.filter((resultObject) => {
			const topSection = resultObject['meta.domPath'][0];
			return topSection === 'top-stories' || topSection === 'lead-today'; //for old homepage (legacy)
		});
		return topSectionObject ? topSectionObject[0].result : null
	};

	const calculatePercentage = (result, total) => parseFloat(((100 / total) * result.result).toFixed(2));

	const components = ['top-stories', 'opinion', 'editors-picks', 'most-popular', 'technology', 'markets', 'life-and-arts', 'video'];

	const validComponentFilter = resultObject => (
		components[resultObject['meta.componentPos']-1] === resultObject['meta.domPath'][0]
	);

	const breakpointFilter = (breakpoint, resultObject) => resultObject['ingest.user.layout'] === breakpoint;

	client.run(scrollDepthQuery, (err, results) => {
		Object.keys(scrollDepthCharts).forEach(breakpoint => {
			let result = results.result
				.filter(breakpointFilter.bind(this, breakpoint))
				.filter(validComponentFilter)
				.sort((a,b) => parseInt(a['meta.componentPos']) - parseInt(b['meta.componentPos']));
			const total = acquireTotal(result);
			result = result.map(result => ({
				result: calculatePercentage(result, total),
				label: `${result['meta.domPath'][0]} [${result['meta.componentPos']}]`
			}));

			scrollDepthCharts[breakpoint]
				.data({ result })
				.render();
		});

		const tabsEl = document.createElement('ul');
		tabsEl.dataset.oComponent = 'o-tabs';
		tabsEl.dataset.oGridColspan = '12';
		tabsEl.className = 'o-tabs o-tabs--buttontabs';
		tabsEl.setAttribute('role', 'tablist');
		tabsEl.innerHTML = breakpoints
			.map(breakpoint => `<li role="tab"><a href="#${breakpoint}">${breakpoint}</a></li>`)
			.join('');
		scrollDepthEl.insertBefore(tabsEl, scrollDepthEl.querySelector('.o-tabs__tabpanel'));
		window.Origami['o-tabs'].init();
	});
};

module.exports = {
	render
};
