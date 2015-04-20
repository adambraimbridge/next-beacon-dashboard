"use strict";

var conf = require('../conf');

module.exports = function(req, res) {
	var opts = {
		graph: true,
		graphs: conf.graphs,
		ctas: conf.ctas,
		optInOuts: conf.optInOuts,
		filters: conf.filters,
		ab: conf.ab,
		title: req.query.title || '', // XSS me
		apiLink: req._parsedUrl.search,
		isAddiction: true
	};

	res.render('main.handlebars', opts);
};
