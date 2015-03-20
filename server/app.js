'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express-handlebars');
var routers         = require('./routers');
var graphs			= require('./graphs.js');
var ctas			= require('./ctas.js');
var filters			= require('./filters.js');

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
	res.render('index.handlebars', { hideMenu: true, graphs: graphs, ctas: ctas });
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

app.get('/content/:uuid', function (req, res) {
	res.redirect('/todo');
});

app.get('/user/:id', function (req, res) {
	res.redirect('/todo');
});

// Routes for API calls
var api = express.Router();
api.use(cacheControl);
api.use(params);
api.get('/export', routers.api.export);
api.get('/', routers.api.query);
app.use('/api', api);

// Routes for drawing graphs 
var dashboard = express.Router();
dashboard.use(params);
dashboard.get('/', routers.graph);
app.use('/graph', dashboard);

// Routes for drawing tabular data 
var tables = express.Router();
tables.use(cacheControl);
tables.use(params);
tables.get('/', routers.table);
app.use('/table', tables);

// Opts (in/out) routes
app.get('/opt-in-out', routers.optInOut.graph);
app.get('/opt-api', routers.optInOut.api);

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
