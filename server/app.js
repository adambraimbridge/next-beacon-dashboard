/*jshint node:true*/
'use strict';

var http			= require('http');
var auth			= require('./middleware/auth');
var activeUsage			= require('./middleware/active-usage');
var cookieParser	= require('cookie-parser');
var app				= module.exports = require('ft-next-express')({ layoutsDir: __dirname + '/../views/layouts' });
var fs 				= require('fs');
var marked 			= require('marked');

require('es6-promise').polyfill();

var KEEN_PROJECT_ID = process.env.KEEN_PROJECT_ID;
var KEEN_READ_KEY = process.env.KEEN_READ_KEY;
var keen_explorer = process.env.KEEN_EXPLORER;

// Indicates the app is behind a front-facing proxy, and to use the X-Forwarded-* headers to determine the connection and the IP address of the client. NOTE: X-Forwarded-* headers are easily spoofed and the detected IP addresses are unreliable.
// See: http://expressjs.com/api.html
app.enable('trust proxy');

app.get('/__gtg', function (req, res) {
	res.send(200);
});

app.get('/__debug-ssl', function(req, res) {
	res.json({
		protocol: req.protocol,
		headers: req.headers
	});
});

app.get('/hashed-assets/:path*', function(req, res) {
	var path = 'http://ft-next-hashed-assets-prod.s3-website-eu-west-1.amazonaws.com' + req.path;
	http.get(path, function(proxyRes) {
		proxyRes.pipe(res);
	});
});

app.use(cookieParser());
app.use(auth);

app.get('/dist/*', function(req, res) {
	var path = 'http://' + keen_explorer + req.path;
	http.get(path, function(proxyRes) {
		proxyRes.pipe(res);
	});
});

app.get('/explorer', function(req, res) {
	var path = 'http://' + keen_explorer + req.path;
	http.get(path, function(proxyRes) {
		proxyRes.pipe(res);
	});
});

app.use(activeUsage);

app.get('/', function (req, res) {
	res.render('home', {
		layout: 'beacon'
	});
});

// TODO:ADAM:20150626 — Allow for :sub urls without requiring a template file
// (so that the :sub can be used as a kind of query parameter for the :name parent)
app.get('/graph/:name/:sub?', function (req, res) {
	var tmpl = req.params.name;
	tmpl += (req.params.sub) ? '-' + req.params.sub : '';

	var article_id = 'beacon-dashboard-' + tmpl;
	Object.keys(req.query).forEach(function(key) {
		article_id += '-' + req.query[key];
	});
	article_id = article_id.toLowerCase();

	res.render(tmpl, {
		layout: 'beacon',
		keen_project: KEEN_PROJECT_ID,
		keen_read_key: KEEN_READ_KEY,
		page_name:req.params.name,
		original_url: req.originalUrl,
		article_id: article_id
	});
});

/* Generic */

app.get('/gallery', function (req, res) {
	res.render('pages/gallery', {
		layout: 'beacon',
		article_id: 'beacon-dashboard-gallery'
	});
});

/* Export */

app.get('/api/export', require('./export'));

/* Blog */

var dir = './progress/';

app.get('/progress/:post', function (req, res) {
	var md = marked(
		fs.readFileSync(dir + req.params.post + '.md', { encoding: 'utf8' }),
		{
			gfm: true
		}
	);
	res.render('blog', {
		layout: 'beacon',
		md: md
	});
});

module.exports.listen = app.listen(process.env.PORT || 5028);
