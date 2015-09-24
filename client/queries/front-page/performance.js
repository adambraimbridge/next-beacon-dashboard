'use strict';

import queryString from 'querystring';

const graphiteBaseUrl = 'https://www.hostedgraphite.com/bbaf3ccf/569381f9-6a60-4c33-a0be-b2272aa7a4a5/graphite/render';
const chartParams = {
	bgcolor: 'FFFFFF',
	fgcolor: '000000',
	majorGridLineColor: '777777',
	width: 890,
	height: 300,
	from: '-7d',
	hideLegend: true
};
const browsers = [
	{
		name: 'Chrome',
		key: 'chrome'
	},
	{
		name: 'Firefox',
		key: 'firefox'
	},
	{
		name: 'IE11',
		key: 'ie_11'
	}
];

var render = () => {
	var queryParameters = queryString.parse(location.search);
	var currentBrowser = queryParameters.browser || browsers[0].key;
	var targetconfigs = [
		{
			title: 'Average page load time',
			target: [
				`movingAverage(keepLastValue(wpt.next_ft_com.europe_dublin_aws.${currentBrowser}.homepage.loadEventEnd), "6hours")`,
				`movingAverage(wpt.next_ft_com.europe_dublin_aws.${currentBrowser}.homepage.loadEventEnd, "7days")`
			]
		}
	];
	var el = document.getElementById('charts');

	// add browser toggle
	var browserOptionsEl = document.createElement('div');
	browserOptionsEl.classList.add('nav--horizontal');
	browserOptionsEl.dataset.oGridColspan = '12';
	var browserItems = browsers
		.map(({name, key}) => key === currentBrowser ? `<li>${name}</li>` : `<li><a href="?browser=${key}">${name}</a></li>`)
		.join('');
	browserOptionsEl.innerHTML = `
		<h3>Browser: </h3>
		<ul>
			${browserItems}
		</ul>
	`;
	el.appendChild(browserOptionsEl);

	targetconfigs.forEach(targetConfig => {
		var titleEl = document.createElement('h2');
		titleEl.textContent = targetConfig.title;
		el.appendChild(titleEl);
		var graphEl = document.createElement('img');
		var query = queryString.stringify(Object.assign({}, chartParams, { target: targetConfig.target }));
		graphEl.src = `${graphiteBaseUrl}?${query}`;
		el.appendChild(graphEl);
	});
};

module.exports = {
	render
};
