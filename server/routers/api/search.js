'use strict';

require('../../conf');
var _ = require('lodash');
var keenIO = require('keen.io');
require('debug')('1');

var keen = keenIO.configure({
	projectId: process.env['KEEN_PROJECT_ID'],
	readKey: process.env['KEEN_READ_KEY']
});

module.exports = function(req, res) {

	var q = new keenIO.Query('count', {
		timeframe: req.query.timeframe ? req.query.timeframe : {
			'start' : req.query.from,
			'end' : req.query.to
		},
		event_collection: req.query.event_collection || 'dwell',
		group_by: [ 'page.location.search.q' ],
		filters: [
			{
				property_name: 'page.location.type',
				operator: 'eq',
				property_value: 'search'
			},
			{
				property_name: 'user.isStaff',
				operator: 'eq',
				property_value: false
			}
		]
	});

	keen.run(q, function(err, response) {

		if (err) {
			res.json(err);
			return;
		}

		var sum = _.sum(response.result, 'result');
		var sortedByAsc = _.sortBy(response.result, 'result').reverse();

		res.json({
			total: sum,
			table: sortedByAsc
		});

	});
};
