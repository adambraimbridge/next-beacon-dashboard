/* global Keen */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var engagementCohorts = require('../../lib/engagement-cohorts');
var timeframe = queryParameters.timeframe || 'previous_84_days';

var render = (el, results) => {
	var cohortsData = engagementCohorts.extract(results);

	// create query for referrers
	var wrappedKeen = require('../../lib/wrapped-keen');
	var latestUsers = cohortsData.slice(-1)[0].users;
	engagementCohorts.buckets.forEach(bucket => {
		var users = Object.keys(latestUsers).filter(uuid => {
			var user = latestUsers[uuid];
			if (bucket.min && user.average < bucket.min) {
				return false;
			} else if (bucket.max && user.average >= bucket.max) {
				return false;
			}
			return true;
		});
		var query = new Keen.Query('count', {
			eventCollection: 'dwell',
			filters: [
				{
					operator: 'eq',
					property_name: 'user.isStaff',
					property_value: false
				},
				{
					operator: 'eq',
					property_name: 'page.location.type',
					property_value: 'article'
				},
				{
					operator: 'in',
					property_name: 'user.uuid',
					property_value: users
				},
				{
					operator: 'exists',
					property_name: 'page.referrer.hostname',
					property_value: true
				}

			],
			groupBy: 'page.referrer.hostname',
			timeframe,
			timezone: 'UTC'
		});
		wrappedKeen.run(query, (err, results) => {
			var groupedHosts = [
				{
					name: 'google',
					hosts: ['\.google\.']
				},
				{
					name: 'twitter',
					hosts: ['^t\.co$', '\.twitter\.']
				},
				{
					name: 'facebook',
					hosts: ['\.facebook\.']
				},
				{
					name: 'ft',
					hosts: ['\.ft\.com$']
				}
			];
			var data = groupedHosts.map(host => ({
				'page.referrer.hostname': host.name,
				result: 0
			}));
			// group by similar hosts
			results.result.forEach(result => {
				var grouped = groupedHosts.some(host => {
					if (result['page.referrer.hostname'].search(host.hosts.join('|')) > -1) {
						data.find(item => item['page.referrer.hostname'] === host.name).result += result.result;
						return true;
					}
				});
				if (!grouped) {
					data.push(result);
				}
			});
			// filter out internal referrers, order, and take the top 10
			data = data
				.filter(result => result['page.referrer.hostname'] !== 'ft')
				.sort((resultOne, resultTwo) => resultTwo.result - resultOne.result)
				.slice(0, 10);

			// create a chart
			var chart = new Keen.Dataviz();
			var chartEl = document.createElement('div');
			el.appendChild(chartEl);
			chart
				.el(chartEl)
				.height(400)
				.title(`${bucket.label} referrers`)
				.chartOptions({
					pointSize: 5
				})
				.prepare()
				.data({
					result: data
				})
				.render();
		});
	});
};

module.exports = {
	query: new Keen.Query('count', {
		eventCollection: 'dwell',
		filters: [
			{
				operator: 'eq',
				property_name: 'user.isStaff',
				property_value: false
			},
			{
				operator: 'eq',
				property_name: 'page.location.type',
				property_value: 'article'
			},
			{
				operator: 'exists',
				property_name: 'user.uuid',
				property_value: true
			},
			{
				operator: 'exists',
				property_name: 'time.day',
				property_value: true
			}
		],
		groupBy: ['user.uuid', 'time.day'],
		timeframe,
		timezone: 'UTC'
	}),
	render: render
};
