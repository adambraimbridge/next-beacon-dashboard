'use strict';

var cta = require('./ctr/cta');
var percentage = require('./ctr/percentage');

var render = () => {
	var el = document.getElementById('charts');

	percentage.render(el);
	cta.render(el);
};

module.exports = {
	render
};
