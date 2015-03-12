'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express-handlebars');
var routers         = require('./routers');
var params          = require('./middleware/params');

var app = module.exports = express();

app.use(express.static(__dirname + '/../static', { maxAge: 3600000 }));

app.engine('handlebars', exphbs({
    defaultLayout: 'layout',
    helpers: {
        formatUrl: require('url').format
    }
}));

app.set('viewine', 'handlebars');

app.get('/__gtg', function(req, res) {
    res.status(200).send();
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

// TODO - list, table, json, export ...

var data = express.Router();
data.get('/:source', routers.data.search);  // FIXME - proxy to AWS

app.use('/api', api);
app.use('/data', data);
app.get('/table', routers.dashboard.table);
app.use('/', dashboard);
app.use('/__test', function (req, res) {
    res.send(req.keen_defaults);
});

app.get('/', function (req, res) {
    res.redirect(302, '/graph?event_collection=dwell&metric=count_unique&target_property=user.erights&title=Unique+users+on+next');
});

// Opts (in/out) routes
app.get('/opt-in-out', routers.optInOut.graph);
app.get('/opt-api', routers.optInOut.api);

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
