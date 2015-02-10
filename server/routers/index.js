
module.exports.dashboard    = require('./dashboard');
module.exports.data         = require('./data');

var util        = require('util');
var keenIO      = require('keen.io');
var flat        = require('flat');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

// The latest 100 events we've logged
module.exports.eventStream = function(req, res) {

    var latest = new keenIO.Query('extraction', {
        timeframe: req.query.timeframe || 'this_2_days',
        event_collection: req.query.event_collection || 'dwell',
        latest: req.query.limit || 100
        });

    keen.run(latest, function(err, response) {
        if (err) {
            res.json(err);
            return;
        }
    
        var flattened = response.result.map(function (event) {
            return flat(event);
        });

        res.json(flattened);
    });
}

// Runs a query attached to the req object = see also ./middleware/params
module.exports.genericQuery = function(req, res) {
    console.log(req.keen_defaults, req.keen_query)
    keen.run(req.keen_query, function(err, response) {
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.json(response);
    });
};
