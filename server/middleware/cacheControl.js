'use strict';

module.exports = function(req, res, next) {
	res.header('Cache-Control', 'max-age=120');
	next();
};
