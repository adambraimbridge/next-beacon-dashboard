/*global $*/
'use strict';

var qs = require('query-string');

//function matchGraph(link) {
//    var linkQuery = qs.parse(link.search);
//    var locQuery = qs.parse(location.search);
//
//    if(link.pathname !== location.pathname) {
//        return false;
//    }
//
//    for(var p in linkQuery) {
//        if(linkQuery[p] !== locQuery[p]) {
//            return false;
//        }
//    }
//
//     return true;
//}

// Attach events to the Bootstrap filter dropdown menus
module.exports = function () {
    var query = qs.parse(location.search);

    $('[data-filter].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        var key = $(this).data('filter');
        if (type) {
            query[key] = type;
            if (type === '__clear__') {
                delete query[key];
            }
            location.search = qs.stringify(query);
        }
    }).each(function() {
        var key = $(this).data('filter');
        $(this).val(query[key] || '__clear__');
    });

	/*
    $('#graph-select li a').each(function() {
        if(matchGraph(this)) {
            $("#graph-select")
                .prev("[data-toggle=dropdown]")
                .text(this.textContent + ' ')
                .append("<span class=\"caret\"></span>");
        }
    });
	*/
};
