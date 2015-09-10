'use strict';

var pageViews = require('./visits/page-views');
var visitors = require('./visits/visitors');

var render = () => {
	var el = document.getElementById('charts');

	pageViews.render(el);
	visitors.render(el);
};

module.exports = {
	render
};
