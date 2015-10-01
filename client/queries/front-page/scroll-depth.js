/* global Keen */
'use strict';

var OTabs = require('o-tabs');
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
			.chartType('areachart')
			.el(graphEl)
			.height(450)
			.chartOptions({
				isStacked: true,
				hAxis: {
					format: 'EEE d'
				}
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
				property_name: 'meta.componentPos',
				property_value: true
			},
			{
				operator: 'ne',
				property_name: 'ingest.user.layout',
				property_value: ''
			},
			{
				operator: 'eq',
				property_name: 'cohort.incumbent',
				property_value: currentUserType
			}
		],
		groupBy: ['meta.componentPos', 'ingest.user.layout'],
		timeframe: 'previous_14_days',
		interval: 'daily',
		timezone: 'UTC'
	});

	client.run(scrollDepthQuery, (err, results) => {
		Object.keys(scrollDepthCharts).forEach(breakpoint => {
			// change results to percentage
			var result = results.result.map(result => {
				var breakpointValue = result.value.filter(value => value['ingest.user.layout'] === breakpoint);
				var total = breakpointValue.reduce((currentTotal, value) => currentTotal += value.result, 0);
				var newValue = breakpointValue.map(value => {
					var newResult = total ? parseFloat(((100 / total) * value.result).toFixed(2)) : 0;

					return Object.assign({}, { result: newResult, category: value['meta.componentPos'] });
				});

				return Object.assign({}, result, { value: newValue });
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
		new OTabs(tabsEl);
	});
};

module.exports = {
	render
};
