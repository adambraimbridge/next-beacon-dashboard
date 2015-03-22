
var client = require('ft-api-client')(process.env.apikey, {});

var keenIO = require('keen.io');
var keen = keenIO.configure(
    {
        projectId: process.env.KEEN_PROJECT_ID,
        readKey: process.env.KEEN_READ_KEY
    }
);

var conf = require('../conf');

module.exports = function(req, res) {

	var opts = {
		graph: true,
		graphs: conf.graphs,
		ctas: conf.ctas,
		filters: []
	};

	var uuid = req.params.uuid;

	client
		.get(req.query.uuid)
		.then(function (article) {
			opts.article = article;
			res.render('content.handlebars', opts);
		}, function (err) {
			res.send(503)
		});

};
