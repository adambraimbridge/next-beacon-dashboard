'use strict';

var express = require('express');
var exphbs = require('express-handlebars');
var cookieParser = require('cookie-parser');
var routers = require('./routers');
var conf = require('./conf');

// Middleware
var params = require('./middleware/params');
var auth = require('./middleware/auth');
var authApi = require('./middleware/auth-api');
var cacheControl = require('./middleware/cacheControl');

var app = module.exports = express();

app.use(express.static(__dirname + '/../static', { maxAge: 3600000 }));

app.engine('handlebars', exphbs({
	defaultLayout: 'layout',
	helpers: {
		formatUrl: require('url').format
	}
}));

app.set('view engine', 'handlebars');

app.get('/__gtg', function(req, res) {
	res.status(200).send();
});

// index
app.get('/', function (req, res) {
	res.render('index.handlebars', { hideMenu: true, graphs: conf.graphs, ctas: conf.ctas, opts: conf.opts });
});

// Force HTTPS in production
app.get('*', function(req, res, next) {
	if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
		res.redirect('https://' + req.headers.host + req.url);
	} else {
		next();
	}
});

// Authenticate all routes beneath here.
// Calls to /api require a "secret" api key in the request header,
// which is handled via `api.use(authApi);`.
// Everything else uses s3o auth.
app.get('*', function(req, res, next) {
	if (!req.params[0] || req.params[0].substr(0,4) != '/api') {
		app.use(cookieParser());
		app.use(auth);
	}
	next();
});

// Simple entry point
app.get('/enter', function (req, res) {
	res.redirect('/graph?event_collection=dwell&metric=count_unique&target_property=user.erights&title=Unique%20users%20on%20next');
});

app.get('/top', require('./routers/top-n'));
app.get('/content', require('./routers/content'));
app.get('/search', require('./routers/search'));
app.get('/user/:erights', function (req, res) { });

// Routes for API calls
var api = express.Router();
api.use(authApi);
api.use(cacheControl);
api.use(params);
api.get('/export', routers.api.export);
api.get('/addiction', routers.api.addiction);
api.get('/search', routers.api.search);
api.get('/funnel', routers.api.funnel);
api.get('/', routers.api.query);

// Routes for drawing graphs
var dashboard = express.Router();
dashboard.use(params);
dashboard.get('/', routers.graph);

// Routes for drawing tabular data
var tables = express.Router();
tables.use(cacheControl);
tables.use(params);
tables.get('/', routers.table);

// Routes for drawing user flow
var flow = express.Router();
flow.use(cacheControl);
flow.use(params);
flow.get('/', routers.flow);

// Routes for components' analytics
var components = express.Router();
components.use(cacheControl);
components.use(params);
components.get('/', routers.components);

app.use('/api', api);
app.use('/graph', dashboard);
app.use('/addiction', routers.addiction);
app.use('/table', tables);
app.use('/flow', flow);
app.use('/components', components);

// Opts (in/out) routes
app.get('/opt-in-out', routers.optInOut.graph);

var port = process.env.PORT || 3001;
app.listen(port, function() {
	console.log("Listening on " + port);
});
