var conf = require('../conf');

var keenIO      = require('keen.io');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports = function (req, res) {

    var q = new keenIO.Query('count', {
        timeframe: req.query.timeframe || 'this_7_days',
        event_collection: req.query.event_collection || 'cta',
        latest: req.query.limit || 10000,
		interval: "yearly",
		filters: [{
			 property_name: "meta.domPath",
			 operator: "contains",
			 property_value: req.query.domPathContains || "header"
		}],
		group_by: ["meta.domPath"]
    });

    keen.run(q, function(err, response) {

		if (err) {
            res.json(err);
            return;
        }

		var sorted = response.result[0].value
					.map(function (row) {
						row.key = row["meta.domPath"];
						return row;
					})
					.sort(function (a, b) {
						return (a.result < b.result) ? 1 : -1;
					})

		res.render('table.handlebars', { 
			graphs: conf.graphs,
			ctas: conf.ctas,
			optInOuts: conf.optInOuts,
			title: req.query.title || '',   // XSS me
			filters: conf.filters,
			data: sorted,
			explain: req.keen_explain
		});

	})
}

module.exports.article = function (req, res) { }
module.exports.user = function (req, res) { }
