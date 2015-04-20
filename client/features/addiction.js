
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');
var qs = require('query-string');

module.exports.init = function () {
    var query = qs.parse(location.search);

    fetch('/api/addiction' + location.search, { credentials: 'same-origin' })
    .then(function(response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    })
    .then(function(data) {
        if(data.code) {
            throw new Error(data.code + ': ' + data.message);
        }
        return data;
    })
    .then(function(data) {
        var table = $('<table>');

		var tr = $('<tr>')
			.append($('<th>').text('Frequency'))
			.append($('<th>').text('Unique users seen'))
			.append($('<th>').text('%'));

		tr.appendTo(table);

		data.map(function (row) {

			//
			var tr = $('<tr>')
				.append($('<td>').text(row.group_by))
				.append($('<td>').text(row.length))
				.append($('<td>').text(row.percentage + '%'));
			tr.appendTo(table);
		})
		table.prependTo('#chart_container');
    })
    .catch(function (e) {
        $('<div>')
            .addClass('alert alert-danger')
            .text(e.message || e.toString())
            .prependTo('#chart_container');
    });
};
