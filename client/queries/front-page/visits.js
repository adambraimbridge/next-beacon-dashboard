'use strict';

var visits = require('./visits/visits');

var render = () => {
	var el = document.getElementById('charts');

	visits.render(el, 'page views', 'count');
	visits.render(el, 'visitors', 'count_unique', { targetProperty: 'user.uuid' });
};

module.exports = {
	render
};
