
var keenIO          = require('keen.io');

var keen = keenIO.configure(
    {
        projectId: process.env['KEEN_PROJECT_ID'],
        readKey: process.env['KEEN_READ_KEY']
    }
);


// Maps query string parameters to a Keen.io Query object
module.exports = function (req, res, next) {

    var explain = [];
    var filters = [];

    if (req.query.pageType) {
        filters.push(
            {
                "property_name": "page.location.type",
                "operator": "eq",
                "property_value": req.query.pageType
            })
        explain.push('by ' + req.query.pageType);
    }

    var isStaff = req.query.isStaff ? (req.query.isStaff === 'true') : true;  // default to true
    

    if (isStaff) {
        explain.push('includes FT staff');
    } else {
        explain.push('excludes FT staff');
    }

    if (req.query.isStaff) {
        filters.push(
            {
                "property_name": "user.isStaff",
                "operator": "eq",
                "property_value": isStaff 
            }
        )
    }
        
    /*filters.push(
        {
            "property_name": "page.location.hostname",
            "operator": "eq",
            "property_value": 'next.ft.com' 
        }
    */
   
    // filter by an individual article
    if (req.query.uuid) {
        filters.push(
            {
                "property_name": "page.capi.id",
                "operator": "eq",
                "property_value": req.query.uuid 
            }
        )
        explain.push('article <a href="http://next.ft.com/' + req.query.uuid + '">' + req.query.uuid  +'</a>');
    }
    
    // filter by an individual article
    if (req.query.erights) {
        filters.push(
            {
                "property_name": "user.erights",
                "operator": "eq",
                "property_value": req.query.erights 
            }
        )
        explain.push('erights ' + req.query.erights);
    }
    
    // filter by a flag 
    if (req.query.flags) {
        filters.push(
            {
                "property_name": "user.flags",
                "operator": "eq",
                "property_value": req.query.flags 
            }
        )
        explain.push('by flag <a href="http://next.ft.com/__toggler">' + req.query.flags + '</a>');
    }

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
        group_by: req.query.group_by || [],
        filters: filters 
    }
    
    explain.push('over ' + keen_defaults.timeframe.replace(/_/g, ' ').replace('this', ''))

    req.keen_explain = explain;
    req.keen_defaults = keen_defaults;
    req.keen_query = new keenIO.Query(metric, keen_defaults);
    next();
}
