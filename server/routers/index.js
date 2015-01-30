
module.exports.dashboard    = require('./dashboard');
module.exports.data         = require('./data');

var util            = require('util');
var keenIO          = require('keen.io');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

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
