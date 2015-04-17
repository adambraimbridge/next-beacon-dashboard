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
		optInOuts: conf.optInOuts,
		filters: [],
		ab: conf.ab,
		title: req.query.title || '',   // XSS me
		apiLink: req._parsedUrl.search,
		explain: req.keen_explain
	};

	res.render('main.handlebars', opts);
};
