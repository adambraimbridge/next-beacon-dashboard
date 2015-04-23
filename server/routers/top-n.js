'use strict';
var conf = require('../conf');
var client = require('ft-api-client')(process.env.apikey, {});

var keenIO = require('keen.io');

var keen = keenIO.configure({
	projectId: process.env['KEEN_PROJECT_ID'],
	readKey: process.env['KEEN_READ_KEY']
});

module.exports = function (req, res) {

	var q = new keenIO.Query('count', {
		timeframe: req.query.timeframe || 'this_24_hours',
		event_collection: req.query.event_collection || 'dwell',
		latest: req.query.limit || 10000,
		interval: "yearly",
		filters: [{
			 property_name: "page.location.type",
			 operator: "eq",
			 property_value: "article"
		}],
		group_by: ['page.capi.id']
	});

	keen.run(q, function(err, response) {

		if (err) {
			res.json(err);
			return;
		}

		// top 10
		var sorted = response.result[0].value
					.sort(function (a, b) {
						return (a.result < b.result) ? 1 : -1;
					})
					.slice(0, 19)
					.map(function (item) {
						return item['page.capi.id'];
					});

		client
			.get(sorted)
			.then(function (articles) {
				var annotate = articles.map(function (item) {
					item.keenio = response.result[0].value.filter(function (dwell) {
						return item.id === dwell['page.capi.id'];
					})[0];
					return item;
				});

			res.render('top.handlebars', {
				graphs: conf.graphs,
				ctas: conf.ctas,
				ab: conf.ab,
				optInOuts: conf.optInOuts,
				title: 'Top page views on Next',
				filters: conf.filters,
				components: conf.components,
				data: annotate,
				explain: req.keen_explain
			});

			}, function(err) {
				res.send(503, err);
			})
			.catch(function(err) {
				res.send(503, err);
			});


	});
};

module.exports.article = function (req, res) { };
module.exports.user = function (req, res) { };
