
var util            = require('util');
var keenIO          = require('keen.io');
var dwell           = require('../queries/dwell');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports = function(req, res) {
    
    switch (req.params.metric) {
        case 'views':
            var metric = 'count';
            break;
        case 'uniques':
            var metric = 'count_unique';
            break;
    };

    keen.run(dwell(metric, {
        excludeStaff: req.query.excludeStaff === 'true' || false,
        pageType: req.query.pageType,
        interval: req.query.interval || 'daily',       // move this to middleware
        isStaff: req.query.isStaff ? (req.query.isStaff === 'true') : true,
        timeframe: req.query.timeframe || 'this_7_days' ,
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
