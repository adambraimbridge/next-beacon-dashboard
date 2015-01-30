
var keenIO          = require('keen.io');

var dwell = function (metric, opts) { 
  
    var filters = [
        {
            "property_name": "user.isStaff",
            "operator": "eq",
            "property_value": opts.isStaff
        }
    ];
    
    if (opts.pageType) {
        filters.push({
            "property_name": "page.location.type",
            "operator": "eq",
            "property_value": opts.pageType
        })
    }

    return new keenIO.Query(metric, {  // TODO allow count_unique too
        event_collection: "dwell",
        target_property: "user.erights",
        interval: opts.interval || 'daily',
        timeframe: opts.timeframe || 'this_2_weeks',
        group_by: (opts.group_by) ? opts.group_by : [],
        filters: filters
    });
};

module.exports = dwell;
