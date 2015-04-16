
var conf		= require('../conf');
var _			= require('lodash');
var keenIO      = require('keen.io');
var debug		= require('debug')('1');

var keen = keenIO.configure({
    projectId: process.env['KEEN_PROJECT_ID'],
    readKey: process.env['KEEN_READ_KEY']
});

module.exports = function (req, res) {

	var group_by = ['user.erights'];
	
	// Allows to see frequency of visit by other property
	if (req.query.group_by) {
		group_by.push(req.query.group_by);
	}

	var q = new keenIO.Query('count_unique', {
        timeframe: {
    		'start' : req.query.from,
    		'end' : req.query.to
		}, 
        target_property: req.query.target_property || 'time.day',
		event_collection: req.query.event_collection || 'dwell',
		group_by: group_by,
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
	
		var a = _.map(response.result, function (item) {
			return item.result;
		});
	
		var b = _.groupBy(a, function (el) {
			return el;
		});
		
		var c = _.map(b, function (el, key) {
			return {
				group_by: key,
				length: el.length
			}
		});

		// sum the total number of users
		var sum = _.sum(c, function (el) {
			return el.length;
		});

		// Calculate number of users as a % of the total
		var e = _.map(c, function (el) {
			el.percentage = (el.length / sum) * 100;
			return el;
		})

		res.json(e);

	});
}
