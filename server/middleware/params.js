
// Assign querystring parameters to a default Keen query object
module.exports = function (req, res, next) {

    res.keen_defaults = {
        interval: req.query.interval || 'this_14_days', 
        timeframe: req.query.timeframe || 'daily',
        group_by: req.query.group_by ? req.query.group_by.split(',') : [],
        filters: {
            isStaff: req.query.isStaff ? (req.query.isStaff === 'true') : true,  // default to true
            pageType: req.query.pageType || undefined
        }
    }

    next();
}
