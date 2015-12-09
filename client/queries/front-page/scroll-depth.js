/* global Keen */
'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var client = require('../../lib/wrapped-keen');

const breakpoints = ['default', 'XS', 'S', 'M', 'L', 'XL'];
const userTypes = ['subscriber', 'registered', 'anonymous'];

var render = () => {
	var currentUserType = queryParameters['user-type'] || userTypes[0];
	var el = document.getElementById('charts');

	var scrollDepthEl = document.createElement('div');
	scrollDepthEl.classList.add('o-grid-row');
	scrollDepthEl.innerHTML = `<h2 data-o-grid-colspan="12">Percentage of visitors that see the 1st component, 2nd component, etc</h2>`;
	el.appendChild(scrollDepthEl);

	// add user type toggle
	var userTypeEl = document.createElement('div');
	userTypeEl.classList.add('nav--horizontal');
	userTypeEl.dataset.oGridColspan = '12';
	var userItems = userTypes
		.map(userType =>
			userType === currentUserType ? `<li>${userType}</li>` : `<li><a href="?user-type=${userType}">${userType}</a></li>`
		)
		.join('');
	userTypeEl.innerHTML = `
		<h3>User type: </h3>
		<ul>
			${userItems}
		</ul>
	`;
	scrollDepthEl.insertBefore(userTypeEl, scrollDepthEl.firstChild);

	var scrollDepthCharts = {};
	breakpoints.forEach(breakpoint => {
		var graphEl = document.createElement('div');
		graphEl.dataset.oGridColspan = '12';
		graphEl.classList.add('o-tabs__tabpanel');
		graphEl.id = breakpoint;
		scrollDepthEl.appendChild(graphEl);

		scrollDepthCharts[breakpoint] = new Keen.Dataviz()
			.chartType('columnchart')
			.el(graphEl)
			.height(450)
			.chartOptions({
				isStacked: true
			})
			.prepare();
	});

	var scrollDepthQuery = new Keen.Query('count', {
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
				property_value: 'control'
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
		timeframe: 'previous_14_days',
		timezone: 'UTC'
	});

	const acquireTotal = (resultObjectArray) => {
		const leadTodayObject = resultObjectArray.filter((resultObject) => {
			return (resultObject['meta.componentPos'] === 1 && resultObject['meta.domPath'][0] === 'lead-today')
		});
		return leadTodayObject ? leadTodayObject[0]['result'] : null
	}

	const calculatePercentage = (result, total) => {
		return parseFloat(((100 / total) * result['result']).toFixed(2));
	}

	const controlFilter = (resultObject) => {
		const controlFilterPaths = ['lead-today', 'editors-picks', 'opinion', 'topic-life-arts', 'topic-markets', 'topic-technology', 'video-picks']
		return controlFilterPaths[resultObject['meta.componentPos'] - 1] === resultObject['meta.domPath'][0]
	}

	const breakpointFilter = (breakpoint, resultObject) => {
		return resultObject['ingest.user.layout'] === breakpoint;
	}

	client.run(scrollDepthQuery, (err, results) => {
		Object.keys(scrollDepthCharts).forEach(breakpoint => {
			const result = results.result.filter(breakpointFilter.bind(this, breakpoint)).filter(controlFilter).map((result) => {
				return result;
			}).sort((a,b) => {
				return parseFloat(a['meta.componentPos']) - parseFloat(b['meta.componentPos']);
			})

			const total = acquireTotal(result);
			result.map((result) => {
				result['result'] = calculatePercentage(result, total);
				result['label'] = result['meta.domPath'][0] + ' [' + result['meta.componentPos'] + ']';
				delete result['ingest.user.layout'];
				delete result['meta.componentPos'];
				delete result['meta.domPath'];
				return result;
			});

			scrollDepthCharts[breakpoint]
				.data({ result })
				.render();
		});

		var tabsEl = document.createElement('ul');
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
