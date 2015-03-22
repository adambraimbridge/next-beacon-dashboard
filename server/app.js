'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express-handlebars');
var routers         = require('./routers');
var conf			= require('./conf')

// Middleware
var params          = require('./middleware/params');
var auth			= require('./middleware/auth');
var cacheControl	= require('./middleware/cacheControl');

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
	res.render('index.handlebars', { hideMenu: true, graphs: conf.graphs, ctas: ctas.conf });
});

// Force HTTPS in production
app.get('*', function(req, res, next) {
	if(process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
		res.redirect('/?https');		
	} else {
		next();
	}
});

// Authenticate all routes beneath here
app.use(auth);

// Simple entry point 
app.get('/enter', function (req, res) {
	res.redirect('/graph?event_collection=dwell&metric=count_unique&target_property=user.erights&title=Unique%20users%20on%20next')
});

app.get('/search', function (req, res) {

	var isUser = /^([0-9]+)$/.test(req.query.q);
	var isContent = /^([\d\w]+)-([\d\w]+)/.test(req.query.q);
	
	if (isUser) {
		var user = '&erights=' + req.query.q;
		var title = '&title=User ' + req.query.q;
		res.redirect('/graph?event_collection=dwell&metric=count&group_by=page.location.type' + user + title);
	} else if (isContent) {
		var uuid = '&uuid=' + req.query.q;
		var title = '&title=Content <a href="http://next.ft.com/' + req.query.q + '">' + req.query.q + '</a>';
		// TODO - by host referrer
		res.redirect('/graph?event_collection=dwell&metric=count_unique&target_property=user.eright' + uuid + title);
	} else {
		res.send('?');
	}

	// TODO 
	//	- dwell by page type - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=page.location.type&erights=10620249
	//	- devices - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=user.deviceType&erights=10620249
	//	- locations - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=user.geo.city&erights=10620249
	// event_collection=dwell&metric=count&group_by=page.location.type&erights=3266367&title=Unique%20users%20for%20user:3266367
});

app.get('/user/:erights', function (req, res) {
});

// Routes for API calls
var api = express.Router();
api.use(cacheControl);
api.use(params);
api.get('/export', routers.api.export);
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

app.use('/api', api);
app.use('/graph', dashboard);
app.use('/table', tables);

// Opts (in/out) routes
app.get('/opt-in-out', routers.optInOut.graph);
app.get('/opt-api', routers.optInOut.api);

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
