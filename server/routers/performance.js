
var util            = require('util');
var keenIO          = require('keen.io');
var performance     = require('../queries/performance');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports =  function(req, res) {
    keen.run(performance.navigationTiming(req.params.metric, {
        interval: req.query.interval,       // move this to middleware
        timeframe: req.query.timeframe,
        target_property: req.query.target_property,
        group_by: (req.query.group_by) ? req.query.group_by.split(',') : []
    }), function(err, response) {
        if (err) {
            res.json(err);
            return;
        }
        console.log(util.inspect(response, { showHidden: true, depth: null })); 
        res.json(response);
    });
};
