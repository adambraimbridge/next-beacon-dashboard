/*jshint node:true*/
'use strict';

var http  = require('http');
var app = module.exports = require('ft-next-express')({ layoutsDir: __dirname + '/../views/layouts' });

require('es6-promise').polyfill();

const KEEN_PROJECT = process.env.KEEN_PROJECT;
const KEEN_READ_KEY = process.env.KEEN_READ_KEY;

app.get('/__gtg', function (req, res) {
	res.send(200);
});

app.get('/hashed-assets/:path*', function(req, res) {
	var path = 'http://ft-next-hashed-assets-prod.s3-website-eu-west-1.amazonaws.com' + req.path;
	http.get(path, function(proxyRes) {
		proxyRes.pipe(res);
	});
});

app.get('/', function (req, res) {
	res.render('summary', { flags: expiredFlags || {}, layout: 'beacon' });
});

app.get('/graph/:name', function (req, res) {
	res.render('graphs', { 
		graph: req.params.name,
		layout: 'beacon'
	});
});

module.exports.listen = app.listen(process.env.PORT || 5028);
