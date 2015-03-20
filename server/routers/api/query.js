
var util        = require('util');
var keenIO      = require('keen.io');
var flat        = require('flat');
var csv			= require('csv');
var csvUtils	= require('./../../../lib/csv-utils');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

var processors = require('../../process.js'); // FIXME what's this?

// Runs a query attached to the req object = see also ./middleware/params
module.exports = function(req, res) {
    var errored = false;
    keen.run(req.keen_query, function(err, response) {
        if (!errored) {
            if (err) {
                res.json({
                    message: err.message,
                    code: err.code
                });
                errored = true;
                return;
            }

            for(var p in processors) {
                if(req.query['process_' + p]) {
                    response = processors[p](req.query['process_' + p], response);
                }
            }

            res.json(response);
        }
    });
};
