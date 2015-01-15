
var keenIO          = require('keen.io');

var countMenuButtonClicks = function (opts) { 

    // TODO wire in to the logic
    var excludeFtStaff = {
        "property_name": "user.isStaff",
        "operator": "eq",
        "property_value": false
    }

    return new keenIO.Query("count_unique", {
        event_collection: "cta",
        target_property: "user.erights",
        filters: [
            {
                "property_name": "meta.domPath",
                "operator": "eq",
                "property_value": "o-header | menu-button"
            }
        ],
        interval: opts.interval || 'daily',
        timeframe: opts.timeframe || 'this_1_weeks',
        group_by: (opts.group_by) ? opts.group_by : []
    });
}

var menuItems = function (opts) { 

    return new keenIO.Query("count", {
        event_collection: "cta",
        filters: [
            {
                "property_name": "meta.domPath",
                "operator": "contains",
                "property_value": "o-header | menu |"
            }
        ],
        interval: opts.interval || 'monthly',
        timeframe: opts.timeframe || 'this_1_months',
        group_by: ['meta.domPath']
    });
}

module.exports.countMenuButtonClicks = countMenuButtonClicks;
module.exports.menuItems = menuItems 
