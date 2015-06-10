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

app.get('/graph/:name/:sub?', function (req, res) {
	var tmpl = req.params.name;
	tmpl += (req.params.sub) ? '-' + req.params.sub : '';
	res.render(tmpl, {
		layout: 'beacon',
		keen_project: KEEN_PROJECT,
		keen_read_key: KEEN_READ_KEY
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
