/*jshint node:true*/
'use strict';

var http			= require('http');
var https			= require('https');
var fetch			= require('isomorphic-fetch');
var aws4			= require('aws4');
var auth			= require('./middleware/auth');
var activeUsage			= require('./middleware/active-usage');
var cookieParser	= require('cookie-parser');
var app				= module.exports = require('ft-next-express')({
	layoutsDir: __dirname + '/../views/layouts',
	withBackendAuthentication: false
});

var fs 				= require('fs');
var marked 			= require('marked');

require('es6-promise').polyfill();

var KEEN_PROJECT_ID = process.env.KEEN_PROJECT_ID;
var KEEN_READ_KEY = process.env.KEEN_READ_KEY;
var KEEN_MASTER_KEY = process.env.KEEN_MASTER;

var conversionfunnel = require('./conversionfunnel');

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

// pipe through to an AWS bucket containing Redshift exports
app.get('/reports/*', function(req, res) {
	// url: `https://${process.env.S3_HOST}/{req.params[0]}`
	var signed = aws4.sign({
		service: 's3',
		hostname: process.env.S3_HOST,
		path: '/' + req.params[0],
		signQuery: true,
		region: 'eu-west-1',
	}, {
		accessKeyId: process.env.S3_AWS_ACCESS,
		secretAccessKey: process.env.S3_AWS_SECRET
	});
	https.get(signed, function(proxyRes) {
		proxyRes.pipe(res);
	});
});

app.get('/explorer', function(req, res) {
	res.render('keen', {
		layout: null,
		keen_project: KEEN_PROJECT_ID,
		keen_read_key: KEEN_READ_KEY,
		keen_master_key: KEEN_MASTER_KEY
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
		layout: req.query.vanilla ? 'vanilla' : 'beacon',
		keen_project: KEEN_PROJECT_ID,
		keen_read_key: KEEN_READ_KEY,
		page_name:req.params.name,
		original_url: req.originalUrl,
		query: req.query,
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

/* Survey cohorts  */

app.get('/surveycohorts', function (req, res) {
	res.render('pages/surveycohorts', {
		layout: 'beacon',
		keen_project: KEEN_PROJECT_ID,
		keen_read_key: KEEN_READ_KEY,
		article_id: 'beacon-dashboard-surveycohorts'
	});
});

app.get('/conversionfunnel', function (req, res) {
	const hostname = 'ft-next-redshift.s3.amazonaws.com';

	const signed = aws4.sign({
		service: 's3',
		hostname: hostname,
		path: '/conversion-funnel.json',
		signQuery: true,
		timeout: 60000,
		region: 'eu-west-1'
	}, {
		accessKeyId: process.env.S3_AWS_ACCESS,
		secretAccessKey: process.env.S3_AWS_SECRET
	});

	const url = `https://${hostname}${signed.path}`;
	const options = signed;

	fetch(url, options)
		.then(response => response.json())
		.then(data => {
			res.render('conversion-funnel', {
				conversionData: conversionfunnel(data),
				layout: 'beacon'
			});
		});
});

module.exports.listen = app.listen(process.env.PORT || 5028);
