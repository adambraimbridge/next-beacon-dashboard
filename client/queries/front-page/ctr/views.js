/* global Keen */
'use strict';

const drawGraph = require('./draw-graph');

const render = (el, promiseOfData, friendlyChosenPeriod) => {

    const viewsEl = document.querySelector('.js-front-page-views');

    const viewsMetric = new Keen.Dataviz()
        .title(`HP page views ${friendlyChosenPeriod}`)
        .chartOptions({
            width: '100%',
            animation: {
                startup: true
            }
        })
        .colors(['#eeeeee'])
        .el(viewsEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-views-chart');

       promiseOfData
       .then((data) => {



        viewsMetric
            .data({
                result: data[data.length-1].byLayout.total.views
            })
            .render();

        drawGraph(data, trendEl, 'views', {
            vAxis: {
                title: 'Number of Front Page views'
            },
            title: 'Homepage Visits'
        });


    });


};

module.exports = {
    render
};
