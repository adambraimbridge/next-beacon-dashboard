var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');
var qs = require('query-string');

var histogram = require('../graphs/histogram.js');
var lines     = require('../graphs/lines.js');
var single    = require('../graphs/single.js');
var stacked   = require('../graphs/stacked.js');
var stacked_area = require('../graphs/stacked-area.js');

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
        if(data.code) {
            throw new Error(data.code + ': ' + data.message);
        }

        return data;
    })
    .then(function(data) {

        var palette = new Rickshaw.Color.Palette();
        var graphType;

        if (_.isArray(data)) { // multiple query
            if(query.single) {
                graphType = histogram;
            } else {
                graphType = lines;
            }
        } else if (query.histogram) {
            data = [data];
            graphType = histogram;
        } else if (query.stacked_area) {
            graphType = stacked_area;
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

        new Rickshaw.Graph.HoverDetail(_.extend({
            graph: graph,
        }, graphSpec.hoverOptions));
        
        new Rickshaw.Graph.Axis.Y({
            graph: graph,
            orientation: 'left',
            element: document.getElementById('y_axis'),
        });

        if(!graphSpec.hideLegend) {
            new Rickshaw.Graph.Legend({
                graph: graph,
                element: document.getElementById('legend')
            });
        }

        if(graphSpec.xaxis) {
            new Rickshaw.Graph.Axis[graphSpec.xaxis](_.extend({
                graph: graph
            }, graphSpec.xaxisOptions));
        }

        graph.render();
    })
    .catch(function (e) {
        $('<div>')
            .addClass('alert alert-danger')
            .text(e.message || e.toString())
            .prependTo('#chart_container');
    });
};
