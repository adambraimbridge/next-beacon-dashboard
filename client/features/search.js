
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');
var qs = require('query-string');

module.exports.init = function () {
    var query = qs.parse(location.search);
    
    fetch('/api/search' + location.search)
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
        
		// total searches
		var sum = $('<p>').text(data.total + ' searches.');
		
		// serach terms table
		var table = $('<table>');	
		var tr = $('<tr>')
			.append($('<th>').text('Search term'))
			.append($('<th>').text('Total'))
		
		tr.appendTo(table);
		
		data.table.map(function (row) {
			
			var term = $('<a>')
				.attr('href', 'http://next.ft.com/search?q=' + row['page.location.search.q'])
				.text(row['page.location.search.q']);
			
			// 
			var tr = $('<tr>')
				.append($('<td>').html(term))
				.append($('<td>').text(row.result))
			tr.appendTo(table);
		})
	
		table.prependTo('#chart_container');
		sum.prependTo('#chart_container');
    })
    .catch(function (e) {
        $('<div>')
            .addClass('alert alert-danger')
            .text(e.message || e.toString())
            .prependTo('#chart_container');
    });
};
