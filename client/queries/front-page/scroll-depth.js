/* global Keen */
'use strict';

var queryString = require('querystring');
var queryParameters = queryString.parse(location.search.substr(1));

var client = require('../../lib/wrapped-keen');

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
	
	var graphEl = document.createElement('div');
	graphEl.dataset.oGridColspan = '12';
	graphEl.classList.add('o-tabs__tabpanel');
	scrollDepthEl.appendChild(graphEl);

	const scrollDepthChart = new Keen.Dataviz()
		.chartType('columnchart')
		.el(graphEl)
		.height(450)
		.chartOptions({
			isStacked: true
		})
		.prepare();

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
		groupBy: ['meta.componentPos', 'meta.domPath'],
		timeframe: 'previous_14_days',
		timezone: 'UTC'
	});

	const acquireTotal = (results) => {
		const leadTodayObject = results.result.filter((resultObject) => {
			return (resultObject['meta.componentPos'] === 1 && resultObject['meta.domPath'][0] === 'lead-today')
		});
		return leadTodayObject ? leadTodayObject[0]['result'] : null
	}

	const calculatePercentage = (result, total) => {
		return (100 / total) * result['result'];
	}

	const controlFilter = (resultObject) => {
		const controlFilterPaths = ['lead-today', 'editors-picks', 'opinion', 'topic-life-arts', 'topic-markets', 'topic-technology', 'video-picks']
		return controlFilterPaths[resultObject['meta.componentPos'] - 1] === resultObject['meta.domPath'][0]
	}

	client.run(scrollDepthQuery, (err, results) => {
		const total = acquireTotal(results);
		const result = results.result.filter(controlFilter).sort((a,b) => {
			return parseFloat(a['meta.componentPos']) - parseFloat(b['meta.componentPos']);
		}).map(result => {
			result['result'] = calculatePercentage(result, total);
			result['meta.componentPos'] = result['meta.domPath'][0] + ' [' + result['meta.componentPos'] + ']';
			return result;
		});

		scrollDepthChart
			.data({ result })
			.render();

		var tabsEl = document.createElement('ul');
		tabsEl.dataset.oComponent = 'o-tabs';
		tabsEl.dataset.oGridColspan = '12';
		tabsEl.className = 'o-tabs o-tabs--buttontabs';
		tabsEl.setAttribute('role', 'tablist');
		window.Origami['o-tabs'].init();
	});
};

module.exports = {
	render
};
