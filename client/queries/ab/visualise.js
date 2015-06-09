/*global $*/

'use strict';

module.exports = function(el, data) {

	var table = $('<table>').addClass('ab__results');

	var tr = $('<tr>')
		.append($('<th>').text('Visitors'))
		.append($('<th>').text('Conversions'))
		.append($('<th>').text('Conversion rate'))
		.append($('<th>').text('Standard error'));

	tr.appendTo(table);

	['on', 'off'].forEach(function(variant) {
		var tr = $('<tr>')
			.append($('<td>').text(data.stats[variant].visitors))
			.append($('<td>').text(data.stats[variant].conversions))
			.append($('<td>').text(data.stats[variant].conversionRate))
			.append($('<td>').text(data.stats[variant].standardError));
		tr.appendTo(table);
	});

	table.prependTo('#ab__container');

	$('.ab__p-val').text(data.stats.confidence.pValue);
	$('.ab__z-score').text(data.stats.confidence.zScore);

	var at90 = data.stats.confidence.at90percent === true ? 'yes' : 'no';
	var at95 = data.stats.confidence.at95percent === true ? 'yes' : 'no';
	var at99 = data.stats.confidence.at99percent === true ? 'yes' : 'no';

	$('.ab__confidence-90').addClass('ab__significance-' + at90).text(at90);
	$('.ab__confidence-95').addClass('ab__significance-' + at95).text(at95);
	$('.ab__confidence-99').addClass('ab__significance-' + at99).text(at99);

};
