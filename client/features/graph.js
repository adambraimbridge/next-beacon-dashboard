var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');
var qs = require('query-string');

var histogram = require('../graphs/histogram.js');
var single    = require('../graphs/single.js');
var stacked   = require('../graphs/stacked.js');

module.exports.init = function () {
    var query = qs.parse(location.search);
    
    fetch('/api' + location.search)
    .then(function(response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    })
    .then(function(data) {

        var palette = new Rickshaw.Color.Palette();
        var graphType;

        if (_.isArray(data)) { // multiple query
            graphType = histogram;
        } else if (query.group_by) {
            graphType = stacked;
        } else {
            graphType = single;
        }

        var graphSpec = graphType(data, palette, query);

        var graph = new Rickshaw.Graph(_.extend({
            element: document.querySelector("#chart"),
            width: document.querySelector("#chart").parentNode.offsetWidth * 0.9,  
            height: window.innerHeight * 0.5,
        }, graphSpec));

        new Rickshaw.Graph.HoverDetail({
            graph: graph,
        });
        
        new Rickshaw.Graph.Axis.Y({
            graph: graph,
            orientation: 'left',
            element: document.getElementById('y_axis'),
        });

        new Rickshaw.Graph.Legend({
            graph: graph,
            element: document.getElementById('legend')
        });

        if(graphSpec.xaxis) {
            new Rickshaw.Graph.Axis[graphSpec.xaxis]({
                graph: graph
            });
        }

        graph.render();
    })
    .catch(function (e) {
        console.error(e);
    });
};
