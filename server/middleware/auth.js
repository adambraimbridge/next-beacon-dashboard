'use strict';

// To see the logs, run this at a bash prompt:
// heroku logs -ta ft-next-beacon-dashboard | grep S3O

var logger = require('ft-next-logger');
var authS3O = require('s3o-middleware');

// Use a BEACON_API_KEY token environment variable for API authentication
var authApi = function(req, res, next) {
	logger.info("S3O: Authenticating API request.");

	var beaconApiKey = process.env.BEACON_API_KEY;
	var secretHeaderToken = req.headers['x-beacon-api-key'];
	if (beaconApiKey && secretHeaderToken) {
		logger.info("API Authentication: Secret header API token detected. ");
		if (beaconApiKey === secretHeaderToken) {
			next();
		} else {
			throw new Error("API authentication error. For access contact next.team@ft.com.");
		}
	} else {

		// The beacon dashboard fetch()es api URLs but doesn't provide the API token.
		// In this case it is better to fall back to the same S3O auth used by all other endpoints.
		logger.info("S3O: Missing 'x-beacon-api-key' header token in API request. Falling back to S3O.");
		authS3O(req, res, next);
	}
};

// Beacon dashboard has API endpoints, which can be consumed by third parties (within FT).
// The public face of https://beacon.ft.com uses s3o (Single Staff Sign-On) to authenticate,
// but that's a 2-Factor Auth, and API calls can't easily work with 2FA.
// So /api calls are authorised differently from the other endpoints.
var auth = function(req, res, next) {
	if (/^\/api/.test(req._parsedUrl.pathname)) {
		authApi(req, res, next);
	} else {
		authS3O(req, res, next);
	}
};

module.exports = auth;
