'use strict';

var stepsConf = require('../../conf/steps');

var keen = require('keen.io').configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

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
            response.descriptions = stepsConf[req.query.steps].map(function (step) {
				return step.description;
            });

            res.json(response);
        }
    });
};
