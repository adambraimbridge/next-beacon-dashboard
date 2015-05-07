'use strict';
var isSecure;
var logger = require('ft-next-logger');
var crypto = require('crypto');
var NodeRSA = require("node-rsa");

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
var publicKey = process.env.S3O_PUBLIC_KEY;
if (!publicKey) throw new Error("The ft-next-beacon-dashboard S3O_PUBLIC_KEY heroku environment variable *must* be set. For support contact next.team@ft.com");

var authenticateToken = function(res,username,token) {

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
		var cookieOptions = { maxAge: 900000, httpOnly: true, secure: isSecure };
		res.cookie('s3o_username', username, cookieOptions);
		res.cookie('s3o_token', token, cookieOptions);
		return true;
	} else {
		return false;
	}
};

var auth = function(req, res, next){
	var s3oUsername, s3oToken;
	isSecure = req.protocol === "https"? true : false;

	if (req.cookies.s3o_username && req.cookies.s3o_token) {

		// Check for s3o username/token cookies
		s3oUsername = req.cookies.s3o_username;
		s3oToken = req.cookies.s3o_token;
		logger.info("S3O: Found cookie token for s3o_username: " + s3oUsername);
	} else if (req.query.username && req.query.token) {

		// Check for s3o username/token URL parameters.
		// These parameters come from https://s3o.ft.com. It redirects back after it does the google authentication.
		s3oUsername = req.query.username;
		s3oToken = req.query.token;
		logger.info("S3O: Found parameter token for s3o_username: " + s3oUsername);
	} else {

		// Send the user to s3o to authenticate
		logger.info("S3O: No token/s3o_username found. Redirecting to https://s3o.ft.com/authenticate … ");
		res.redirect("https://s3o.ft.com/authenticate?redirect="+ encodeURIComponent(req.protocol + "://"+ req.headers.host + req.url));
	}

	if (s3oUsername && s3oToken) {
		if (authenticateToken(res, s3oUsername, s3oToken)) {
			next();
		} else {
			throw new Error("Authentication error. For access contact next.team@ft.com.");
		}
	}
};
module.exports = auth;
