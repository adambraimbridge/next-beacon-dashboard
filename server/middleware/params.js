
var keenIO          = require('keen.io');

var keen = keenIO.configure(
    {
        projectId: process.env['KEEN_PROJECT_ID'],
        readKey: process.env['KEEN_READ_KEY']
    }
);


// Maps query string parameters to a Keen.io Query object
module.exports = function (req, res, next) {

    var filters = [];

    if (req.query.pageType) {
        filters.push(
            {
                "property_name": "page.location.type",
                "operator": "eq",
                "property_value": req.query.pageType
            })
    }

    var isStaff = req.query.isStaff ? (req.query.isStaff === 'true') : true;  // default to true
    
    filters.push(
        {
            "property_name": "user.isStaff",
            "operator": "eq",
            "property_value": isStaff 
        }
    )
    
    if (req.query.domPathEquals) {
        filters.push(
            {
                "property_name": "meta.domPath",
                "operator": "eq",
                "property_value": req.query.domPathEquals
            }
        )
    }
    
    if (req.query.domPathContains) {
        filters.push(
            {
                "property_name": "meta.domPath",
                "operator": "contains",
                "property_value": req.query.domPathContains
            }
        )
    }
    
    var metric = req.query.metric || 'count';
    var keen_defaults = {
        event_collection: req.query.event_collection || undefined,
        target_property: req.query.target_property || undefined,
        interval: req.query.interval || 'daily', 
        timeframe: req.query.timeframe || 'this_14_days',
        group_by: req.query.group_by ? req.query.group_by.split(',') : [],
        filters: filters 
    }
    
    req.keen_defaults = keen_defaults;
    req.keen_query = new keenIO.Query(metric, keen_defaults);
    next();
}
