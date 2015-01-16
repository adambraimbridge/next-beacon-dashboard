
var keenIO          = require('keen.io');

var navigationTiming = function (metric, opts) { 
    return new keenIO.Query(metric, {
        event_collection: "timing",
        target_property: opts.target_property || 'meta.timings.domContentLoadedEventEnd',
        interval: opts.interval || 'hourly',
        timeframe: opts.timeframe || 'this_1_weeks',
        group_by: (opts.group_by) ? opts.group_by : []
    });
}

module.exports.navigationTiming = navigationTiming; 
