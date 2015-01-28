
require('isomorphic-fetch');
require('es6-promise').polyfill();

module.exports.init = function () {

    // A list of activity around different page types 
    fetch('/api/dwell/uniques?interval=daily&timeframe=today&group_by=page.location.type&excludeStaff=false')
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function(data) {
            var html = data.result
                .map(function (n) {
                    return n.value
                })
                .reduce(function (a, b) {
                    return a.concat(b);
                })
                .sort(function (a, b) {
                    return a.result < b.result;
                })
                .map(function (n) {
                    console.log(n.result, n["page.location.type"]);
                    return '<li>' + 
                                '<big>' + n.result +' people</big>' +
                                    ' ' +
                                '<span> used ' +
                                    n["page.location.type"] 
                                '</span>' +
                            '</li>';
                }).join('');
            document.getElementById('pagetype').innerHTML = html;
        })

    // A list of daily uniques
    fetch('/api/dwell/uniques?interval=daily&timeframe=this_7_days&excludeStaff=false')
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function(data) {

            // ...
            var html = data.result.reverse().map(function (day) {
                var daysAgo = parseInt((new Date() - new Date(day.timeframe.start)) / 24 / 60 / 60 / 1000);
                var dateDisplay = (daysAgo < 1) ? 'today' : daysAgo + ' days ago';
                return '<li>' + 
                            '<big>' + day.value +' people</big>' +
                                ' ' +
                            '<time datetime="' + day.timeframe.start + '">' +
                                dateDisplay
                            '</time>' +
                        '</li>';
            }).join('');
           
            document.getElementById('uniques').innerHTML = html;
             
        });

};
