/* global Keen */
'use strict';

const drawGraph = require('./draw-graph');
const drawMetric = require('./draw-metric');



const render = (el, promiseOfData) => {

    const clicksPerUserEl = document.querySelector('.js-front-page-clicks-per-user');

    const keenContainer = new Keen.Dataviz()
        .title('Clicks per user')
        .chartOptions({
            width: '100%',
            animation: {
                startup: true
            }
        })
        .colors(['#49c5b1'])
        .el(clicksPerUserEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-clicks-per-user-chart');

    promiseOfData
       .then((data) => {

        drawMetric(data, keenContainer, 'clicksPerUser');

        drawGraph(data, trendEl, 'clicksPerUser', {
            title: 'Average clicks per user on the Homepage',
            vAxis: {
                title: 'Average clicks per front-page user'
            }
        });

    });

};

module.exports = {
    render
};

