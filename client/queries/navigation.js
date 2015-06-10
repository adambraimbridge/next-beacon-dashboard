/* global Keen, $, _ */

'use strict';

var query = new Keen.Query("count_unique", {
	eventCollection: "cta",
	filters: [{
		"property_name":"meta.domPath",
		"operator":"contains",
		"property_value":"header"
	},
	{
		"property_name":"user.isStaff",
		"operator":"eq",
		"property_value":false
	}],
	groupBy: "meta.domPath",
	targetProperty: "user.uuid",
	timeframe: "this_2_weeks",
	timezone: "UTC",
	maxAge: 3600
});

var render = function (el, results, opts) {
	var data = _.map(_.sortByAll(results.result, ['result', 'meta.domPath']), _.values).reverse();

	var table = $('<table>');
	$('<tr>')
		.append($('<td>').html('<b>CTA element</b>'))
		.append($('<td>').html('<b>Total</b>'))
		.appendTo(table);

	for(var i=0; i<40; i++){
		$('<tr>')
			.append($('<td>').text(data[i][0]))
			.append($('<td>').text(data[i][1]))
			.appendTo(table);
	}

	table.appendTo(el);
};

module.exports = {
	query:query,
	render:render
};
