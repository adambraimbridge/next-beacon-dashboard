var keenIO = require('keen.io');
var keen = keenIO.configure(
    {
        projectId: process.env.KEEN_PROJECT_ID,
        readKey: process.env.KEEN_READ_KEY
    }
);

var conf = require('../conf');

module.exports.graph = function(req, res) {

	var opts = {
		optInOut: true,
		graphs: conf.graphs,
		ctas: conf.ctas,
		filters: [],
		title: req.query.title || '',   // XSS me
		apiLink: req._parsedUrl.search,
		explain: req.keen_explain
	};

	res.render('main.handlebars', opts);
};

module.exports.api = function(req, res) {

	var query = new keenIO.Query('count_unique', {
        eventCollection: 'optin',
        filters: [{'property_name':'meta.type','operator':'exists','property_value':true}],
        groupBy: 'meta.type',
        targetProperty: 'user.erights',
        timeframe: req.query.timeframe || 'previous_7_days'
	});
	var errored = false;

    keen.run(query, function(err, response) {
        if (!errored) {
            if (err) {
                res.json({
                    message: err.message,
                    code: err.code
                });
                errored = true;
                return;
            }

            res.json(response);
        }
    });
};
