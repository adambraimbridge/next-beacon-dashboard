
require('es6-promise').polyfill();
require('isomorphic-fetch');
var Rickshaw = require('rickshaw');


fetch('/api/cta/menu-items')
    .then(function(response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    })
    .then(function(data) {

        var sortedByPopularity = data.result[0].value.sort(function (a, b) {
            return a.result < b.result 
        });

        var asHtml = sortedByPopularity.map(function (item) {
            return '<li>' + item['meta.domPath'] + ' (' + item.result + ')</li>';
        })

        console.log(asHtml);

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



/*var reqwest = require('reqwest');

// /users/by/browser.family,browser.major

reqwest('/users/by/browser.family,browser.major', function (resp) {
    var el = document.getElementById('browsers');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['browser.family'], b['browser.major'], b.result].join(' ') + '</li>'
    }).join('');
});


reqwest('/users/by/content.genre', function (resp) {
    var el = document.getElementById('genre');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['content.genre'], b.result].join(' ') + '</li>'
    }).join('');
});

reqwest('/users/by/eRights', function (resp) {
    var el = document.getElementById('uniques');
    el.innerHTML = resp.result.length;
});

reqwest('/users/by/country', function (resp) {
    var el = document.getElementById('country');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['country'], b.result].join(' ') + '</li>'
    }).join('');
});
*/