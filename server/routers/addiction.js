
var conf		= require('../conf');
var _			= require('lodash');
var keenIO      = require('keen.io');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports = function (req, res) {

    var q = new keenIO.Query('count_unique', {
        timeframe: {
    		'start' : req.query.from,
    		'end' : req.query.to
		}, 
        target_property: 'time.day',
		event_collection: req.query.event_collection || 'dwell',
		group_by: ['user.erights'],
		filters: [
			{
				property_name: 'user.isStaff',
				operator: 'eq',
				property_value: false 
			}
		]
    });
    
	keen.run(q, function(err, response) {

		if (err) {
            res.json(err);
            return;
        }

		if (req.query.raw) {
			res.json(response);
			return;
		}

		var a = response.result.map(function (item) {
			return item.result;
		});

		var b = _.groupBy(a, function (el) {
			return el;
		});
		
		var c = _.map(b, function (el) {
			return el.length;
		});

		res.json(c);
	});
}
