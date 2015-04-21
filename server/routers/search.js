'use strict';

var conf = require('../conf');

module.exports = function(req, res) {

	var opts = {
		graph: true,
		graphs: conf.graphs,
		ctas: conf.ctas,
		filters: conf.filters,
        flow: conf.flow,
		ab: conf.ab,
		title: req.query.title || '',   // XSS me
		apiLink: req._parsedUrl.search
	};

	res.render('main.handlebars', opts);
};
