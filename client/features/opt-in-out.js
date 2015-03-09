require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');
var qs = require('query-string');

module.exports.init = function () {
    var query = qs.parse(location.search);
    
    fetch('/opt-api' + location.search)
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
        var optEls = document.getElementsByClassName('opt');

        if (!optEls.length) { return; }

        var optTypes = data.result;
        var total = _.reduce(optTypes, function (m, type) {
            return m + type.result;
        }, 0);

        document.getElementById('opted-in').style.width = Math.floor(optTypes[0].result / total * 100) + '%';
        document.getElementById('opted-in-p').innerHTML = optTypes[0].result;

        document.getElementById('opted-out').style.width = Math.floor(optTypes[1].result / total * 100) + '%';
        document.getElementById('opted-out-p').innerHTML = optTypes[1].result;

        optEls[0].className += ' opt--active';
    })
    .catch(function (e) {
        $('<div>')
            .addClass('alert alert-danger')
            .text(e.message || e.toString())
            .prependTo('#chart_container');
    });
};
