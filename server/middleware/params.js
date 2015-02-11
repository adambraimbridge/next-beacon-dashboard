var keenIO = require('keen.io');
var _ = require('../../bower_components/lodash/lodash.js');
var filters = require('../filters.js');

var keen = keenIO.configure(
    {
        projectId: process.env['KEEN_PROJECT_ID'],
        readKey: process.env['KEEN_READ_KEY']
    }
);


// Maps query string parameters to a Keen.io Query object
module.exports = function (req, res, next) {

    var explain = [];

    req.query.isStaff = req.query.isStaff ? (req.query.isStaff === 'true') : true; // default to true

    var activeFilters = _(filters).map(function(filter, field) {
        if(req.query[field]) {
            return _.extend({
                property_value: req.query[field]
            }, filter);
        }
    }).compact().value();

    console.log(activeFilters);

    var fields = [
        'event_collection',
        'target_property',
        'interval',
        'timeframe',
        'group_by'
    ];

    var params = _.pick(req.query, fields);
    var metrics = [].concat(req.query.metric || 'count');

    req.keen_defaults = {};

    var queries = metrics.map(function(metric, i) {
        var query = _.defaults(_.mapValues(params, function(param) {
            return _.isArray(param) ? param[i] : param;
        }), {
            interval: 'daily', 
            timeframe: 'this_14_days',
            group_by: []
        });

        query.filters = activeFilters;
        req.keen_defaults[metric] = query;
        return new keenIO.Query(metric, query);
    });

    // explain.push('over ' + keen_defaults.timeframe.replace(/_/g, ' ').replace('this', ''))

    req.keen_explain = explain;
    req.keen_query = queries;
    next();
};
