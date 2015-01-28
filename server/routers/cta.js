
var util            = require('util');
var keenIO          = require('keen.io');
var navigation      = require('../queries/navigation');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports.menu = function(req, res) {
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
};


module.exports.menuItems = function(req, res) { 
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
};

module.exports.search = function(req, res) {
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
};

module.exports.articleCards = function(req, res) {
    var count = new keenIO.Query("count", {
        event_collection: "cta",
        filters: [
            {
                "property_name": "meta.domPath",
                "operator": "contains",
                "property_value": req.query.dom_path || "article-card"
            }
        ],
        interval: req.query.interval || 'daily',
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
};
