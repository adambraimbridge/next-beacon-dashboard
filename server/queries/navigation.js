
var keenIO          = require('keen.io');

var pageType = {
    "property_name": "page.location.type",
    "operator": "eq",
    "property_value": undefined
}

var countMenuButtonClicks = function (opts) { 

    var filters = [
            {
                "property_name": "meta.domPath",
                "operator": "eq",
                "property_value": "o-header | menu-button"
            },
            {
                "property_name": "user.isStaff",
                "operator": "eq",
                "property_value": opts.isStaff 
            }
    ];

    if (opts.pageType) {
        pageType.property_value = opts.pageType;
        filters.push(pageType);
    }

    return new keenIO.Query("count_unique", {
        event_collection: "cta",
        target_property: "user.erights",
        filters: filters, 
        interval: opts.interval || 'daily',
        timeframe: opts.timeframe || 'this_1_weeks',
        group_by: (opts.group_by) ? opts.group_by : []
    });
}

var menuItems = function (opts) { 
    
    var filters = [
            {
                "property_name": "meta.domPath",
                "operator": "contains",
                "property_value": "o-header | menu |"
            },
            {
                "property_name": "user.isStaff",
                "operator": "eq",
                "property_value": opts.isStaff 
            }
    ];
 
    console.log(filters);

    if (opts.pageType) {
        pageType.property_value = opts.pageType;
        filters.push(pageType);
    }
    
    return new keenIO.Query("count", {
        event_collection: "cta",
        filters: filters, 
        interval: opts.interval || 'monthly',
        timeframe: opts.timeframe || 'this_1_months',
        group_by: ['meta.domPath']
    });
}

module.exports.countMenuButtonClicks = countMenuButtonClicks;
module.exports.menuItems = menuItems 
