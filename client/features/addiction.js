var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');

module.exports.init = function () {
    
    fetch('/api' + location.search)

        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })

        .then(function(data) {

            var palette = new Rickshaw.Color.Palette();

            var data = _.groupBy(data.result[0].value, 'result');
            var series = _.map(data, function (n, i) { return { x: parseInt(i), y: n.length }  })
            var ctx = document.getElementById("chart-js").getContext("2d");
            
            console.log(series); 
            var s = [];
            s.push({
                    name: 'Unique users',
                    data: series,
                    color: palette.color()
                });
            

            var graph = new Rickshaw.Graph({
                element: document.querySelector("#chart"),
                width: document.querySelector("#chart").parentNode.offsetWidth * 0.9,  
                height: window.innerHeight * 0.5,
                series: s,
                renderer: 'bar' 
            });
            
            var y_axis = new Rickshaw.Graph.Axis.Y( {
                graph: graph,
                orientation: 'left',
                element: document.getElementById('y_axis'),
            });

            var legend = new Rickshaw.Graph.Legend( {
                graph: graph,
                element: document.getElementById('legend')
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail({
                graph: graph,
                formatter: function(series, x, y) {
                    var map = {
                        1: 'visited one day',
                        2: 'returned two days',
                        3: 'returned three days',
                        4: 'returned four days',
                        5: 'returned five days',
                        6: 'returned six days',
                        7: 'returned every day',
                    };
                    return '<span>' + y + ' users ' + map[x] + ' this week</span>';
                }
            });

            graph.render();

        })
        .catch(function (e) {
            console.error(e);
        });

};
