/* global Keen, $, _ */

'use strict';

const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const drawGraph = require('./ctr/draw-graph');
const drawMetric = require('./ctr/draw-metric');
const moment = require('moment');

function daysAgo(n) {
	return moment.unix(moment().startOf('day').unix()-(n * 86400)).toDate();
}

const capitalise = string => string.slice(0, 1).toUpperCase() + string.slice(1);

const filter = {
		isOnHomepage: [{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'frontpage'
		}],
		hasLayout: [{
			"operator":"exists",
			"property_name":"ingest.user.layout",
			"property_value":true
		},
		{
			"operator":"ne",
			"property_name":"ingest.user.layout",
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
		layout: [{
			operator: 'eq',
			property_name: 'ingest.user.layout',
			property_value: queryParameters['layout']
		}],
		abControl: [
			{
				operator: 'exists',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: true
			},
			{
				operator: 'eq',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: 'control'
			}
		],
		abVariant: [
			{
				operator: 'exists',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: true
			},
			{
				operator: 'eq',
				property_name: 'ab.frontPageLayoutPrototype',
				property_value: 'variant'
			}
		]
};

const getDataForTimeframe = (timeframeDays, interval, abCohort) => {
	const timeframe = `previous_${timeframeDays}_days`;

	let defaultFilters = filter.isOnHomepage.concat(filter[`ab${capitalise(abCohort)}`] || []);

	const users = new Keen.Query('count_unique', {
			eventCollection: 'dwell',
			target_property: 'user.uuid',
			filters: defaultFilters.concat(filter.hasLayout),
			groupBy: ['ingest.user.layout'],
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});

	const views = new Keen.Query('count', {
			eventCollection: 'dwell',
			filters: defaultFilters.concat(filter.hasLayout),
			groupBy: ['ingest.user.layout'],
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});

	const totalUsers = new Keen.Query('count_unique', {
			eventCollection: 'dwell',
			target_property: 'user.uuid',
			filters: defaultFilters,
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});

	const totalViews = new Keen.Query('count', {
			eventCollection: 'dwell',
			filters: defaultFilters,
			timeframe,
			timezone: 'UTC',
			interval: interval,
			maxAge: 3600
	});

	const clicks = function(to, from) {
		return new Keen.Query('count', {
			eventCollection: 'cta',
			filters: defaultFilters.concat(filter.isAClick),
			groupBy: ['ingest.user.layout', 'user.uuid', 'meta.domPath'],
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
		client.run(views).then(res => res.result),
		client.run(totalUsers).then(res => res.result),
		client.run(totalViews).then(res => res.result)
	];

	let i = timeframeDays;
	// group the clicks by week
	while (i > 0) {
		queryPromises.push(client.run(clicks(i - 7, i)).then(res => res.result));
		i -= 7;
	}

	return Promise.all(queryPromises)
		.then(([ users, views, totalUsers, totalViews, ...clicks ]) => {

		clicks = _.flatten(clicks);
		//components = [] or []
		return function(components, layouts) {
			//for each day
			return clicks.map((day, index) => {

				let linesToShow = [];
				if(!components.length) {
					components = ['all'];
				}
				if(!layouts.length) {
					layouts = ['all'];
				}

				if(components.length > 1) {
					components.forEach(component => {
						linesToShow.push({
							component: component,
							layout: layouts && layouts[0] ? layouts[0] : 'all'
						});
					});
				} else {
					components.forEach(component => {
						layouts.forEach(layout => {
							linesToShow.push({
								component: component,
								layout: layout
							});
						});
					});
				}

				return linesToShow.map(line => {
						const filterMatches = (data) => {
							let isMatch = data.result > 0;
							if(data['meta.domPath'] && line.component && line.component !== 'all') {
									isMatch = isMatch && (data['meta.domPath'].indexOf(line.component) === 0);
							}
							if(data['ingest.user.layout'] && line.layout && line.layout !== 'all') {
								isMatch = isMatch && (data['ingest.user.layout'] === line.layout);
							}

							return isMatch;
						};
						const matchingClicks = day.value.filter(filterMatches);
						const matchingViews = views[index].value.filter(filterMatches);
						const matchingUsers = users[index].value.filter(filterMatches);

						const totalViewsCount = line.layout === 'all' ? totalViews[index].value : matchingViews.reduce((prev, curr) => (prev + curr.result), 0);
						const totalUsersCount = line.layout === 'all' ? totalUsers[index].value : matchingUsers.reduce((prev, curr) => (prev + curr.result), 0);

						const clicks = matchingClicks.reduce((prev, curr) => (prev + curr.result), 0);

						const uniqueClickers = Object.keys(_.chain(matchingClicks).groupBy('user.uuid').value());

						return {
							component: line.component,
							layout: line.layout,
							timeframe: day.timeframe,
							clicks: clicks,
							uniqueClicks: uniqueClickers.length,
							users: totalUsersCount,
							views: totalViewsCount,
							ctr: parseFloat(((totalUsersCount > 0 ? 100 / totalUsersCount : 100) * uniqueClickers.length).toFixed(1)),
							clicksPerUser: parseFloat((totalUsersCount > 0 ? clicks / totalUsersCount : clicks).toFixed(1))
						};

				});
			});
		};
	});
};


const render = () => {
	const timeframeDays = queryParameters['timeframe-days'] || '28';
	const interval = 'daily';
	const abCohort = queryParameters['ab-cohort'] || 'control';

	// un-link the selected cohort and timeframe
	document.querySelector(`.ab-cohort[href*="ab-cohort=${abCohort}"]`).outerHTML = capitalise(abCohort);
	document.querySelector(`.timeframe-days[href*="timeframe-days=${timeframeDays}"]`).outerHTML = timeframeDays;

	const promiseOfData = getDataForTimeframe(timeframeDays, interval, abCohort);
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


	promiseOfData.then(query => {

		const getCurrentState = () => {
			const components = Array.from(document.querySelectorAll('.js-toggle-components:checked') || [])
				.map(el => el.dataset[abCohort])
				.filter(comp => !!comp);
			const layouts = Array.from(document.querySelectorAll('.js-toggle-layout:checked') || []).map((el) => el.getAttribute('data-layout')).filter(layout => !!layout);

			return {
				components,
				layouts
			};
		};

		const draw = ({components, layouts}) => {


			const data = query(components, layouts);
			metrics.forEach((metricConfig) => {
				drawMetric(data, metricConfig);
				drawGraph(data, metricConfig);
			});

		};


		draw(getCurrentState());




		$('.js-front-page-toggles').removeClass('is-hidden');

		$('.js-front-page-toggles .toggle-line').change(() => {

			const state = getCurrentState();

			if(state.components.length > 1) {
				$('.js-toggle-layout').attr('type', 'radio');
				if(state.layouts.length > 1) {
					state.layouts = state.layouts.slice(0, 1);
					$('.js-toggle-layout').prop('checked', false);
					$(`.js-toggle-layout[data-layout="${state.layouts[0]}"]`).prop("checked", true);

				}

			} else {
				$('.js-toggle-layout').attr('type', 'checkbox');
			}
			if('requestAnimationFrame' in window) {
				window.requestAnimationFrame(draw.bind(this, state));
			} else {
				setTimeout(draw.bind(this, state), 0);
			}
		});

	});


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
