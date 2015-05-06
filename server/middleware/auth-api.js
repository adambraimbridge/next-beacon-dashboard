'use strict';

// Beacon dashboard has API endpoints, which can be consumed by third parties (within FT).
// The public face of https://beacon.ft.com uses s3o (Single Staff Sign-On) to authenticate,
// but that's a 2-Factor Auth, and API calls can't easily work with 2FA.
// So /api calls use a secret header token and a simple match-check to validate.
// In this case there is a BASIC_AUTH token environment variable available,
// so it's utilised here to make things a bit easier.
var authApi = function(req, res, next) {
	var basicAuth = process.env.BASIC_AUTH;
	if (!basicAuth) throw new Error("The ft-next-beacon-dashboard BASIC_AUTH environment variable *must* be set. For support contact next.team@ft.com");
	var basicAuthToken = basicAuth.split(':')[1];

	var secretHeaderToken = req.headers['X-Beacon-Dashboard-API-Key'];
	if ((!basicAuthToken || !secretHeaderToken) || basicAuthToken !== secretHeaderToken ) {

		// Fall back to the same S3O auth used by all other endpoints

// TODO: Find a way of doing this that doesn't suck (and that works)

		var app = require('../app');
		var cookieParser = require('cookie-parser');
		var auth = require('../middleware/auth');
		app.use(cookieParser());
		app.use(auth);
	}
};

module.exports = authApi;
