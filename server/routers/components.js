"use strict";

var conf = require('../conf');

module.exports = function(req, res) {
	var opts = {
		graphs: conf.graphs,
		ctas: conf.ctas,
		optInOuts: conf.optInOuts,
		filters: conf.filters,
		flow: conf.flow,
		components: conf.components,
		ab: conf.ab,
		title: req.query.title || '', // XSS me
		apiLink: req._parsedUrl.search
	};

	res.render('main.handlebars', opts);
};
