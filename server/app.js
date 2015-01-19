'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var keenIO          = require('keen.io');
var exphbs          = require('express3-handlebars');
var navigation      = require('./queries/navigation');
var performance     = require('./queries/performance');
var dwell           = require('./queries/dwell');

var routers         = require('./routers');

// Configure instance. Only projectId and writeKey are required to send data.
var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

var app = module.exports = express();

var asJson = function(err, response) {
    if (err) {
        res.json(err);
        return;
    }
    console.log(util.inspect(response, { showHidden: true, depth: null })); 
    res.json(response);
};

app.use(express.static(__dirname + '/../static', { maxAge: 86400000 }));

app.engine('handlebars', exphbs());
app.set('viewine', 'handlebars');

app.get('/__gtg', function(req, res) {
    res.status(200).send();
});

var api = express.Router();
api.get('/cta/menu-button', routers.cta.menu); 
api.get('/cta/menu-items', routers.cta.menuItems); 
api.get('/cta/search-button', routers.cta.search); 
api.get('/api/timing/performance/:metric', routers.performance); 
api.get('/api/dwell/:metric', routers.dwell); 

app.use('/api', api)

var dashboard = express.Router();
app.use('/', api)

app.get('/', function(req, res) {
    res.render('index.handlebars', { });
});

var features = {
    navigation: 'Navigation menu',
    biscuits: 'Biscuits'
}

app.get('/features/:feature', function(req, res) {
    var opts = {
        title: features[req.params.feature]
    }
    opts[req.params.feature] = true;
    res.render('layout.handlebars', opts);
});


app.get('/api/timing', function(req, res) {

    var count = new keenIO.Query("average", {
        event_collection: "timing",
        target_property: "meta.timings." + req.query.data,
        interval: req.query.interval || 'hourly',
        timeframe: req.query.timeframe || 'today',
        group_by: (req.query.group) ? req.query.group.split(',') : []
    });
    
    keen.run(count, function(err, response){
        if (err) {
            res.json(err);
            return;
        }
        res.json(response);
    });

});

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
