var keenIO = require('keen.io');
var _ = require('../../bower_components/lodash/lodash.js');
var filters = require('../filters.js');
var moment = require('moment');

var keen = keenIO.configure(
    {
        projectId: process.env['KEEN_PROJECT_ID'],
        readKey: process.env['KEEN_READ_KEY']
    }
);


// Maps query string parameters to a Keen.io Query object
module.exports = function (req, res, next) {
    req.query.isStaff = req.query.isStaff ? (req.query.isStaff === 'true') : true; // default to true

    if(req.query.inTheLast) {
        req.query.inTheLast = moment().add(1, 'day').startOf('day').subtract(1, req.query.inTheLast).toISOString();
    }

    var activeFilters = _(filters).map(function(filter, field) {
        if(req.query[field]) {
            return _.extend({
                property_value: req.query[field]
            }, filter);
        }
    }).compact().value();

    var explainFilters = _(activeFilters).map(function(filter) {
        return filter.explain();
    }).compact().join(', ');

    var fields = [
        'event_collection',
        'target_property',
        'interval',
        'timeframe',
        'group_by',
        'percentile'
    ];

    var params = _.pick(req.query, fields);
    var metrics = [].concat(req.query.metric || 'count');

    req.keen_defaults = {};

    var queries = metrics.map(function(metric, i) {
        var query = _.defaults(_.mapValues(params, function(param) {
            return _.isArray(param) ? param[i] : param;
        }), {
            interval: req.query.single ? null : 'daily', 
            timeframe: req.query.single ? null : 'this_14_days',
            group_by: []
        });

        query.filters = activeFilters;
        req.keen_defaults[
            _.isArray(params.event_collection) ? params.event_collection[i] : metric
        ] = query;
        return new keenIO.Query(metric, query);
    });

    // explain.push('over ' + keen_defaults.timeframe.replace(/_/g, ' ').replace('this', ''))

    req.keen_explain = explainFilters;
    req.keen_query = queries;
    next();
};
