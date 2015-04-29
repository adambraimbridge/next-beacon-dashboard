'use strict';
var isSecure;
var crypto = require('crypto');
var NodeRSA = require("node-rsa");
var cookieOptions = { maxAge: 900000, httpOnly: true, secure: isSecure };

// TODO: Always use https://s3o.ft.com/publickey or cached copy,
// rather than using an environment variable or hard-coding it.
var publicKey = "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAu37tyRosqi5m22+/DFpmBG3ySwa7F1mOKSGi5ALineHWO3Pa9JIjxVl9wqj0zGuOJJZlDfWMILEEphe3l3xb+iiMhEuUceqkL21fJx4toy3buGhM/9VL72CYLl2aUGCqu+Q2qXNtxhqC6TrB+AU9g4RUlrjmI8VcCAhhgGMkX6z5mcI3mB5S/fNZL73RSEenDnHUNz1As6Km4glvzBZLu2axWijs+Y1b1U/ilYiUu8mchha2S1LSKdA6wLt6zrE0EH7zCve91Yzpypw/MpfPYVmDrzYRA/z04f88nowGA9b+DJfgIpPSvmyhlgpbYqhnDRwCEMniIoayPkFR4oFONQrLT8ARDk56PHSTmCb7BVQTnrzRbJMV0nVln+eHensryFhA/PBCoxowPjH2jPDWgiM5M0HHqtPFG+307uSSBTAzM1gdKAdim2M9ivICKpXS1yP/O9dVtWtA0rsuiKU+vKtLPk3tSX9rpopbIH9C6w8shnMGcyVyckugVz2T6s4gySTtDNLHIugc6n2bDSPlMaZ+uWlrHtZeWBbxvs1ZlwYnfAs1Ohi9xdTuO1Q4DKUvcVxmhglufn5bASJ5MLd6sJaeNnuuAoUSKw6/8B8Eh1whvHy583t17oA43SPZbfxAj622yi73kT15YmwsO7DDjtfV1ME+qsDrt3sFYtRNDlsCAwEAAQ==";

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
		res.cookie('s3o_username', username, cookieOptions);
		res.cookie('s3o_token', token, cookieOptions);
		return true;
	} else {
		return false;
	}
}

var auth = function(req, res, next){
	var s3oUsername, s3oToken;
	isSecure = req.protocol === "https" ? true : false;

	if (req.cookies.s3o_username && req.cookies.s3o_token) {

		// Check for s3o username/token cookies
		console.log("\n\n Found: s3o cookies. \n\n");
		s3oUsername = req.cookies.s3o_username;
		s3oToken = req.cookies.s3o_token;
	} else if (req.query.username && req.query.token) {

		// Check for s3o username/token URL parameters.
		// These parameters come from https://s30.ft.com. It redirects back after it does the google authentication.
		console.log("\n\n Found: s3o parameters. \n\n");
		s3oUsername = req.query.username;
		s3oToken = req.query.token;
	} else {

		// Send the user to s3o to authenticate
		console.log("\n\n No s3o data found. Redirecting to s3o auth … \n\n");
		res.redirect("https://s3o.ft.com/authenticate?redirect=" + encodeURIComponent(req.protocol + "://" + req.headers.host + req.url));
	}

	if (s3oUsername && s3oToken) {
		if (authenticateToken(res, s3oUsername, s3oToken)) {
			next();
		} else {
			throw new Error("Authentication error. For access contact next.team@ft.com.");
		}
	}
}

module.exports = auth;

