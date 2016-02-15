/* global Keen, $, _ */

'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const drawGraph = require('./ctr/draw-graph');
const drawMetric = require('./ctr/draw-metric');
const moment = require('moment');

const queryParams = Object.assign(
	{
		deviceType: 'all',
		component: 'all',
		timeframe: '8'
	},
	queryString.parse(location.search.substr(1))
);

function daysAgo(n) {
	return moment.unix(moment().startOf('day').unix()-(n * 86400)).toDate();
}

queryParams.component = queryParams.component.split(',');
const filter = {
		isOnHomepage: [{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'frontpage'
		}],
		hasLayout: [{
			"operator":"exists",
			"property_name":"deviceAtlas.primaryHardwareType",
			"property_value":true
		},
		{
			"operator":"ne",
			"property_name":"deviceAtlas.primaryHardwareType",
			"property_value": ""
		}],
		hasUUID: [{
			"operator":"exists",
			"property_name":"user.uuid",
			"property_value":true
		}],
		isAClick: [{
				operator: 'in',
				property_name: 'meta.nodeName',
				property_value: ['a', 'button']
		},
		{
				operator: 'exists',
				property_name: 'meta.domPath',
				property_value: true
		}],
		component: [{
				operator: queryParams.component.length > 1 ? 'in' : 'contains',
				property_name: 'meta.domPath',
				property_value: queryParams.component[0] === 'all' ? '' : (queryParams.component.length > 1 ? queryParams.component : queryParams.component[0])
		}],
		deviceType: [{
				operator: 'contains',
				property_name: 'deviceAtlas.primaryHardwareType',
				property_value: queryParams['deviceType'] === 'all' ? '' : (queryParams['deviceType'] || '')
		}]
};

const getDataForTimeframe = (timeframeDays, interval) => {
	const timeframe = `previous_${timeframeDays}_days`;

	let defaultFilters = filter.isOnHomepage.concat(filter.deviceType)

	const users = new Keen.Query('count_unique', {
			eventCollection: 'dwell',
			target_property: 'user.uuid',
			filters: defaultFilters.concat(filter.hasLayout),
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});

	const views = new Keen.Query('count', {
			eventCollection: 'dwell',
			filters: defaultFilters.concat(filter.hasLayout),
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});


	const clicks = function(to, from) {
		return new Keen.Query('count', {
			eventCollection: 'cta',
			filters: defaultFilters.concat(filter.isAClick).concat(filter.component),
			groupBy: ['user.uuid'],
			timeframe: {
				start: daysAgo(from),
				end: daysAgo(to)
			},
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
		});
	};

	const queryPromises = [
		client.run(users).then(res => res.result),
		client.run(views).then(res => res.result)
	];

	let i = timeframeDays;
	// group the clicks by week
	while (i > 0) {
		queryPromises.push(client.run(clicks(i - 7, i)).then(res => res.result));
		i -= 7;
	}

	return Promise.all(queryPromises)
		.then(([ users, views, ...clicks ]) => {

		clicks = _.flatten(clicks);
		//components = [] or []
		return clicks.map((day, index) => {

			const clicks = day.value.filter(c => c.result > 0); //only want people who clicked
			const totalClicks = clicks.reduce((prev, curr) => (prev + curr.result), 0);
			const uniqueClickers = Object.keys(_.chain(clicks).groupBy('user.uuid').value());

			const totalViewsCount = views[index].value;
			const totalUsersCount = users[index].value;

			return {
				timeframe: day.timeframe,
				clicks: totalClicks,
				uniqueClicks: uniqueClickers.length,
				users: totalUsersCount,
				views: totalViewsCount,
				ctr: parseFloat(((totalUsersCount > 0 ? 100 / totalUsersCount : 100) * uniqueClickers.length).toFixed(1)),
				clicksPerUser: parseFloat((totalUsersCount > 0 ? totalClicks / totalUsersCount : totalClicks).toFixed(1))
			};

		});
	});
};


const render = () => {
	const timeframeDays = queryParams['timeframe'] ? parseInt(queryParams['timeframe']) * 7 : 28;
	const interval = 'daily';

	const promiseOfData = getDataForTimeframe(timeframeDays, interval);
	const metrics = [
		{
			id: 'ctr',
			title: 'CTR',
			metricConfig: {
				suffix: '%'
			},
			chartConfig: {}
		},
		{
			id: 'clicksPerUser',
			title: 'Clicks per user',
			metricConfig: {},
			chartConfig: {}
		},
		{
			id: 'users',
			title: 'Homepage Users',
			metricConfig: {},
			chartConfig: {}
		},
		{
			id: 'views',
			title: 'Homepage Page Views',
			metricConfig: {},
			chartConfig: {}
		}
	];

	metrics.forEach(metric => {

		metric.keenMetricContainer = new Keen.Dataviz()
			.title(metric.title)
			.chartOptions(Object.assign({
					width: '100%'
			}, metric.metricConfig))
			.colors(['#49c5b1'])
			.el(document.querySelector(`.js-front-page-metric[data-metric="${metric.id}"]`))
			.prepare();

		metric.chartEl = new Keen.Dataviz()
				.el(document.querySelector(`.js-front-page-chart[data-metric="${metric.id}"]`))
				.chartType('linechart')
				.title(metric.title)
				.height(450)
				.chartOptions({
						hAxis: {
								format: 'EEE d',
								title: 'Date'
						},
						vAxis: {
								title: metric.title
						},
						trendlines: {
								0: {
										color: 'green'
								}
						}
				})
				.prepare();
	});


	promiseOfData.then(data => {
		metrics.forEach((metricConfig) => {
			drawMetric(data, metricConfig);
			drawGraph(data, metricConfig);
		});
	});

	document.querySelector(`input[name="deviceType"][value="${queryParams.deviceType}"`)
		.setAttribute('checked', 'checked');

	document.querySelector(`input[name="component"][value="${queryParams.component}"`)
		.setAttribute('checked', 'checked');

	document.querySelector(`input[name="timeframe"][value="${queryParams.timeframe}"`)
		.setAttribute('checked', 'checked');

	if(!document.location.hash) {
		document.location.hash = '#front-page-ctr-chart';
	}

	const metric = document.querySelector(`.front-page__metric[href="${document.location.hash}"]`);
	if(metric) {
		metric.classList.add('is-selected');
	}

	$('.front-page__metric').on('click', (e) => {
		const selected = document.querySelector('.front-page__metric.is-selected');
		if(selected) {
			selected.classList.remove('is-selected');
		}
		e.currentTarget.classList.add('is-selected');
	});

};

module.exports = {
	render
};
