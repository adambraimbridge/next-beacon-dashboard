/* global Keen */
'use strict';

const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));

const client = require('../../lib/wrapped-keen');

const breakpoints = ['default', 'XS', 'S', 'M', 'L', 'XL'];
const userTypes = ['subscriber', 'registered', 'anonymous'];
const abCohortTypes = ['variant', 'control'];

const render = () => {
	const currentUserType = queryParameters['user-type'] || userTypes[0];
	const currentabCohort = queryParameters['ab-cohort'] || abCohortTypes[0];
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
						<a href="?user-type=${userType}&amp;ab-cohort=${currentabCohort}">
							${userType}
						</a>
					</li>
				`
		)
		.join('');

	const abCohortItems = abCohortTypes
		.map(abCohortType =>
			abCohortType === currentabCohort
				? `<li>${abCohortType}</li>`
				: `
					<li>
						<a href="?user-type=${currentUserType}&amp;ab-cohort=${abCohortType}">
							${abCohortType}
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
		<h3>A/B Test:</h3>
		<ul>
			${abCohortItems}
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

	const scrollDepthQuery = new Keen.Query('count', {
		eventCollection: 'scrolldepth',
		filters: [
			{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'frontpage'
			},
			{
				operator: 'exists',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: true
			},
			{
				operator: 'eq',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: currentabCohort
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
		],
		groupBy: ['meta.componentPos', 'meta.domPath', 'ingest.user.layout'],
		timeframe: {
        "start": "2015-11-30T00:00:00.000Z",
        "end": "2016-01-15T00:00:00.000Z"
    },
		timezone: 'UTC'
	});

	const acquireTotal = resultObjectArray => {
		const topSectionObject = resultObjectArray.filter((resultObject) => {
			const topSection = resultObject['meta.domPath'][0];
			return currentabCohort === 'variant' ? topSection === 'top-stories' : topSection === 'lead-today';
		});
		return topSectionObject ? topSectionObject[0].result : null
	};

	const calculatePercentage = (result, total) => parseFloat(((100 / total) * result.result).toFixed(2));

	const components = {
		variant: ['top-stories', 'opinion', 'editors-picks', 'most-popular', 'technology', 'markets', 'life-and-arts', 'video'],
		control: ['lead-today', 'editors-picks', 'opinion', 'topic-life-arts', 'topic-markets', 'topic-technology', 'video-picks']
	};

	const validComponentFilter = resultObject => (
		components[currentabCohort][resultObject['meta.componentPos']-1] === resultObject['meta.domPath'][0]
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
