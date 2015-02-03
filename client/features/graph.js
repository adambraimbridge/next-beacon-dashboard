
var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();

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

            console.log(data);

            if (/group_by/.test(location.search)) {
               
                var numberOfSeries = data.result.map(function (a) { return a.value.length })[0];
                var key = data.result.map(function (a) { return Object.keys(a.value[0]).filter(function (k) { return k !== 'result' }) })[0];

                console.log(key, numberOfSeries);

                var series = [];
                for(var n = 0; n < numberOfSeries; n++) {
                    series.push(
                        {
                            data: data.result.map(function (a) {
                                return {
                                    x: new Date(a.timeframe.start).valueOf() / 1000,
                                    y: a.value[n].result
                                }
                            }),
                            color: palette.color(),
                            name: data.result.map(function (a) {
                                return a.value[n][key];
                            })[0]
                        }
                    )
                }
            } else {
                var series = [{
                    data: data.result.map(function (result) {
                        return {
                            x: new Date(result.timeframe.start).valueOf() / 1000,
                            y: result.value
                        }
                    }),
                    color: palette.color(),
                    name: 'interactions'
                }]
            }

            var graph = new Rickshaw.Graph({
                element: document.querySelector("#chart"),
                width: document.querySelector("#chart").parentNode.offsetWidth * 0.9,  
                height: window.innerHeight * 0.5,
                series: series
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail( {
                graph: graph,
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

            graph.render();
        })
        .catch(function (e) {
            console.error(e);
        });

};
