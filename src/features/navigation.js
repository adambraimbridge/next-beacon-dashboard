var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();

module.exports.init = function () {

    fetch('/api/cta/menu-items' + location.search)
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function(data) {

            var sortedByPopularity = data.result[0].value.sort(function (a, b) {
                return a.result > b.result 
            });

            var asHtml = sortedByPopularity.reverse().map(function (item) {
                return '<li>' + item['meta.domPath'] + ' (' + item.result + ')</li>';
            })
            document.querySelector('.menu-items__list').innerHTML = asHtml.join('');
        });

    fetch('/api/cta/menu-button' + location.search)

        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })

        .then(function(data) {
        
            var series = data.result.map(function (result) {
                return {
                    x: new Date(result.timeframe.start).valueOf() / 1000,
                    y: result.value
                }
            });

            var graph = new Rickshaw.Graph({
                element: document.querySelector("#chart"),
                width: document.querySelector("#chart").parentNode.offsetWidth * 0.9,  
                height: window.innerHeight * 0.5,
                series: [{
                    data: series,
                    color: 'steelblue',
                    name: 'interactions'
                }]
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail( {
                graph: graph,
            });
            
            var y_axis = new Rickshaw.Graph.Axis.Y( {
                graph: graph,
                orientation: 'left',
                element: document.getElementById('y_axis'),
            });

            graph.render();
        });

};
