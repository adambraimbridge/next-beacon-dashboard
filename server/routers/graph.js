'use strict';

var conf = require('../conf');

module.exports = function(req, res) {

	// is an AB test
	var isAb = /user\.ab\.([\w\d]+)/.exec(req.query.group_by);

	// ... and if so find the test metadata
	var abTest;
	if (isAb) {
		var testName = isAb[1];
		abTest = conf.ab.filter(function (test) {
			return test.flag === testName;
		})[0];
	}

	var opts = {
		graph: true,
		graphs: conf.graphs,
		ctas: conf.ctas,
		optInOuts: conf.optInOuts,
		flow: conf.flow,
		filters: conf.filters,
		ab: conf.ab,
		abTest: abTest,
		title: req.query.title || '', // XSS me
		apiLink: req._parsedUrl.search,
		explain: req.keen_explain
	};

	res.render('main.handlebars', opts);
};
