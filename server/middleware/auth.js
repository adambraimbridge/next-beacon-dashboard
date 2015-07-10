'use strict';

// The Staff Single Sign On (S3O) public key is available at https://s3o.ft.com/publickey.
//  — S3O validates only @ft.com google accounts (and a whitelist of non-ft.com accounts).
//    It displays an error to the user if they try to sign in with an invalid account.
//  — It's intended to change sporadically and without warning, mainly for security testing.
//  — Currently it comes in DER format and needs to be converted to PEM format,
//    but a PEM version should soon be available.
//  – The key is stored in the config-vars repository ...
//    http://git.svc.ft.com/projects/NEXTPRIVATE/repos/config-vars/browse/models/production.json
//    ... and consumed by heroku to make it available as an environment variable.
//    https://dashboard.heroku.com/orgs/financial-times/apps/ft-next-beacon-dashboard/settings
//  – The intention is that config-vars will push its settings into all apps, so if it changed
//    we would update manually and it would fix instantly.
//
// To see the logs, run this at a bash prompt:
// heroku logs -ta ft-next-beacon-dashboard | grep S3O

var logger = require('ft-next-logger');
var crypto = require('crypto');
var NodeRSA = require("node-rsa");
var url = require('url');

if (!process.env.S3O_PUBLIC_KEY) {
	throw new Error('Beacon requires S3O_PUBLIC_KEY to be set');
}

if (!process.env.BEACON_API_KEY) {
	throw new Error('Beacon requires BEACON_API_KEY to be set');
}

// Authenticate token and save/delete cookies as appropriate.
var authenticateToken = function(res, username, token) {
	var publicKey = process.env.S3O_PUBLIC_KEY;

	// Convert the publicKey from DER format to PEM format
	// See: https://www.npmjs.com/package/node-rsa
	var buffer = new Buffer(publicKey, "base64");
	var derKey = new NodeRSA(buffer, 'pkcs8-public-der');
	var publicPem = derKey.exportKey('pkcs8-public-pem');

	// See: https://nodejs.org/api/crypto.html
	var verifier = crypto.createVerify("sha1");
	verifier.update(username);
	var result = verifier.verify(publicPem, token, "base64");

	if (result) {
		logger.info("S3O: Authentication successful: " + username);
		var cookieOptions = {
			maxAge: 900000,
			httpOnly: true
		};
		res.cookie('s3o_username', username, cookieOptions);
		res.cookie('s3o_token', token, cookieOptions);
		return true;
	}
	else {
		logger.info("S3O: Authentication failed: " + username);
		res.clearCookie('s3o_username');
		res.clearCookie('s3o_token');
		res.send("<h1>Authentication error.</h1><p>For access, contact next.team@ft.com.<p>Try clearing your cookies, then return to the <a href='/'>home page.</a></p>");
		return false;
	}
};

var authS3O = function(req, res, next) {

	// Check for s3o username/token URL parameters.
	// These parameters come from https://s3o.ft.com. It redirects back after it does the google authentication.
	if (req.query.username && req.query.token) {
		logger.info("S3O: Found parameter token for s3o_username: " + req.query.username);

		if (authenticateToken(res, req.query.username, req.query.token)) {

			// Strip the username and token from the URL (but keep any other parameters)
			delete req.query['username'];
			delete req.query['token'];
			var cleanURL = url.parse(req.path);
			cleanURL.query = req.query;

			logger.info("S3O: Parameters for " + username + " detected in URL. Redirecting to base path: " + url.format(cleanURL));
			return res.redirect(url.format(cleanURL));
		}
	}
	// Check for s3o username/token cookies
	else if (req.cookies.s3o_username && req.cookies.s3o_token) {
		logger.info("S3O: Found cookie token for s3o_username: " + req.cookies.s3o_username);

		if (authenticateToken(res, req.cookies.s3o_username, req.cookies.s3o_token)) {
			next();
		}
	}
	else {

		// Send the user to s3o to authenticate
		logger.info("S3O: No token/s3o_username found. Redirecting to https://s3o.ft.com/authenticate … ");
		return res.redirect("https://s3o.ft.com/authenticate?redirect=" + encodeURIComponent(req.protocol + "://" + req.headers.host + req.url));
	}
};

// Use a BEACON_API_KEY token environment variable for API authentication
var authApi = function(req, res, next) {
	logger.info("Authenticating API request.");

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
		logger.info("Missing 'x-beacon-api-key' header token in API request. Falling back to S3O.");
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
