'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var keenIO          = require('keen.io');
var exphbs          = require('express3-handlebars');

// Configure instance. Only projectId and writeKey are required to send data.
var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

var app = module.exports = express();

app.engine('handlebars', exphbs());
app.set('viewine', 'handlebars');

app.get('/__gtg', function(req, res) {
    res.status(200).send();
});

// ...
app.get('/clicks', function(req, res) {
    
    var count = new keenIO.Query("count", {
        event_collection: "click",
        target_property: "country"
    });

    // Send query
    keen.run(count, function(err, response){
        if (err) {
            res.json(err);
            return;
        }
        console.log('**', response);
        res.render('clicks.handlebars', response);
    });
     
});

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
