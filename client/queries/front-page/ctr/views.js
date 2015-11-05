/* global Keen */
'use strict';

const drawGraph = require('./draw-graph');
const drawMetric = require('./draw-metric');

const render = (el, promiseOfData) => {

    const viewsEl = document.querySelector('.js-front-page-views');

    const keenContainer = new Keen.Dataviz()
        .title('Page Views')
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



        drawMetric(data, keenContainer, 'views');


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
