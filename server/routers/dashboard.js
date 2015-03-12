var graphs = require('../graphs.js');
var filters = require('../filters.js');

module.exports.graph = function(req, res) {
    
    var opts = {
        graph: true,
        graphs: graphs,
        filters: filters,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain
    };

    res.render('main.handlebars', opts);
};


var keenIO      = require('keen.io');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports.table = function (req, res) {

    var q = new keenIO.Query('count', {
        timeframe: req.query.timeframe || 'this_7_days',
        event_collection: req.query.event_collection || 'cta',
        latest: req.query.limit || 1000,
		interval: "yearly",
		filters: [{
			 property_name: "meta.domPath",
			 operator: "contains",
			 property_value: "o-header | nav"
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

		res.render('table.handlebars', { data: sorted });

	})
}
