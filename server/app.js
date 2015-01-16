'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var keenIO          = require('keen.io');
var exphbs          = require('express3-handlebars');
var navigation      = require('./queries/navigation');

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

app.get('/api/cta/menu-button', function(req, res) {
    keen.run(navigation.countMenuButtonClicks({
        interval: req.query.interval,       // move this to middleware
        timeframe: req.query.timeframe,
        group_by: (req.query.group_by) ? req.query.group_by.split(',') : []
    }), function(err, response) {
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.json(response);
    });
})


app.get('/api/cta/menu-items', function(req, res) {
    keen.run(navigation.menuItems({
        interval: req.query.interval,       // move this to middleware
        timeframe: req.query.timeframe,
        group_by: (req.query.group_by) ? req.query.group_by.split(',') : []
    }), function(err, response) {
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.json(response);
    });
})









app.get('/users/by/:group', function(req, res) {

    var count = new keenIO.Query("count", {
        event_collection: "click",
        target_property: "country",
        timeframe: 'today',
        group_by: req.params.group.split(',')
    });
    
    keen.run(count, function(err, response){
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.json(response);
    });
    
})

app.get('/', function(req, res) {
    res.render('index.handlebars', { });
});

var features = {
    navigation: 'Navigation menu', 
    article: 'Article', 
}

app.get('/features/:feature', function(req, res) {
    res.render('layout.handlebars', { title: features[req.params.feature], 
        navigation: req.params.feature === 'navigation'
    });
});




app.get('/api/:collection', function(req, res) {
})

app.get('/api/cta/search-button', function(req, res) {

    var count = new keenIO.Query("count", {
        event_collection: "cta",
        filters: [
            {
                "property_name": "meta.domPath",
                "operator": "eq",
                "property_value": "o-header | search-button"
            }
        ],
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

// ...
app.get('/clicks', function(req, res) {
    
    var count = new keenIO.Query("count", {
        event_collection: "click",
        target_property: "country",
        interval: req.query.interval || 'daily',
        timeframe: req.query.timeframe || 'this_2_days'
    });
    
    var count1 = new keenIO.Query("count", {
        event_collection: "click",
        target_property: "country",
        interval: 'hourly',
        timeframe: 'today'
    });

    // Send query
    keen.run([count, count1], function(err, response){
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.render('clicks.handlebars', { today: response[1].result, nDays: response[0].result });
    });
     
});

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
