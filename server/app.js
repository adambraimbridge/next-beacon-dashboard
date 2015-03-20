'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express-handlebars');
var routers         = require('./routers');
var params          = require('./middleware/params');
var auth			= require('./middleware/auth');
var graphs			= require('./graphs.js');
var ctas			= require('./ctas.js');
var filters			= require('./filters.js');

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

app.get('/', function (req, res) {
	res.render('index.handlebars', { hideMenu: true, graphs: graphs, ctas: ctas });
});

app.get('*', function(req, res, next) {
	if(process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
		res.redirect('/?https');		
	} else {
		next();
	}
});

app.use(auth);

app.get('/enter', function (req, res) {
	res.redirect('/graph?event_collection=dwell&metric=count_unique&target_property=user.erights&title=Unique%20users%20on%20next')
});

var cacheControl = function (req, res, next) {
    res.header('Cache-Control', 'max-age=120');
    next();
}

// API routes
var api = express.Router();
api.use(cacheControl);
api.use(params);
api.get('/stream', routers.eventStream);
api.get('/', routers.genericQuery);

// Dashboard routes
var dashboard = express.Router();
dashboard.use(params);
dashboard.get('/graph', routers.dashboard.graph);

var tables = express.Router();
tables.use(cacheControl);
tables.use(params);
tables.get('/', routers.dashboard.table);

// TODO - list, table, json, export ...

var data = express.Router();
data.get('/:source', routers.data.search);  // FIXME - proxy to AWS
app.use('/api', api);
app.use('/data', data);
app.use('/tables', tables);
app.use('/', dashboard);
app.use('/__test', function (req, res) {
    res.send(req.keen_defaults);
});


// Opts (in/out) routes
app.get('/opt-in-out', routers.optInOut.graph);
app.get('/opt-api', routers.optInOut.api);

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
