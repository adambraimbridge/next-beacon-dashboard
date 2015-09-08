/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

var render = (el, results) => {
	var tableEl = document.createElement('table');
	var tableHeadEl = document.createElement('thead');
	tableEl.appendChild(tableHeadEl);
	var tableHeadRowEl = document.createElement('tr');
	tableHeadEl.appendChild(tableHeadRowEl);
	['name', 'value'].forEach(text => {
		var tableHeadCellEl = document.createElement('th');
		tableHeadCellEl.textContent = text;
		tableHeadRowEl.appendChild(tableHeadCellEl);
	});

	var tableBodyEl = document.createElement('tbody');
	tableEl.appendChild(tableBodyEl);

	results.result
		.sort((resultOne, resultTwo) => resultTwo.result - resultOne.result)
		.forEach(result => {
			var domPath = result['meta.domPath'];
			var tableBodyRowEl = document.createElement('tr');
			tableBodyRowEl.dataset.component = domPath.split(' | ')[0];
			tableBodyRowEl.innerHTML = `
				<td><a href="https://next.ft.com/uk#domPath:${domPath}">${domPath}</a></td>
				<td>${result.result}</td>
			`;
			tableBodyEl.appendChild(tableBodyRowEl);
		});

	tableEl.appendChild(tableBodyEl);

	// pull out components
	var selectEl = document.createElement('select');
	['all'].concat(
		results.result
			.map(result => result['meta.domPath'].split(' | ')[0])
			// dedupe
			.filter((component, index, components) => components.indexOf(component) === index)
		).forEach(component => {
			var optionEl = document.createElement('option');
			optionEl.textContent = component;
			selectEl.appendChild(optionEl);
		});

	selectEl.addEventListener('change', ev => {
		var value = ev.srcElement.value;
		[...tableBodyEl.querySelectorAll('tr')].forEach(tr => tr.style.display = (value === 'all' || tr.dataset.component === value ? 'table-row' : 'none'));
	});

	el.appendChild(selectEl);
	el.appendChild(tableEl);
};

module.exports = {
	query: new Keen.Query('count', {
		eventCollection: 'cta',
		filters: [
			// {
			// filter removed as deprecated (temporarily?)
			// 	operator: 'eq',
			// 	property_name: 'user.isStaff',
			// 	property_value: false
			// },
			{
				operator: 'eq',
				property_name: 'url.type',
				property_value: 'frontpage'
			},
			{
				operator: 'exists',
				property_name: 'meta.domPath',
				property_value: true
			}
		],
		groupBy: 'meta.domPath',
		timeframe: queryParameters.timeframe || 'previous_14_days',
		timezone: 'UTC'
	}),
	render: render
};
