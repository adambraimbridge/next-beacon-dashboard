/*jshint node:true*/
'use strict';

var http			= require('http');
var auth			= require('./middleware/auth');
var cookieParser	= require('cookie-parser');
var app				= module.exports = require('ft-next-express')({ layoutsDir: __dirname + '/../views/layouts' });
var fs 				= require('fs');
var marked 			= require('marked');

require('es6-promise').polyfill();

var KEEN_PROJECT = process.env.KEEN_PROJECT;
var KEEN_READ_KEY = process.env.KEEN_READ_KEY;

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
	res.redirect('/graph/uniques');
});

app.use(cookieParser());
app.use(auth);

// TODO:ADAM:20150626 — Allow for :sub urls without requiring a template file
// (so that the :sub can be used as a kind of query parameter for the :name parent)
app.get('/graph/:name/:sub?', function (req, res) {
	var tmpl = req.params.name;
	tmpl += (req.params.sub) ? '-' + req.params.sub : '';

	// Using http://blogs.ft.com/ intentionally here as it's the only way to get
	// o-chat to work. http://blogs.ft.com/ redirects to ft.com anyway, so it's harmless.
	// NOTE: When this can be changed to https://beacon.ft.com/, consider that
	// all comments will need to be migrated, and that would be a super hassle.
	var articleid = 'beacon-dashboard-' + tmpl;
	Object.keys(req.query).forEach(function(key) {
		articleid += '-' + req.query[key];
	});
	var oChatParameters = {
		articleid: articleid.toLowerCase(),
		url: 'http://blogs.ft.com/' + req.originalUrl
	};

	res.render(tmpl, {
		layout: 'beacon',
		keen_project: KEEN_PROJECT,
		keen_read_key: KEEN_READ_KEY,
		page_name:req.params.name,
		oChatParameters: oChatParameters
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
