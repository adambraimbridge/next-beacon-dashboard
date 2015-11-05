/* global Keen */
'use strict';

const drawGraph = require('./draw-graph');
const drawMetric = require('./draw-metric');

const render = (el, promiseOfData) => {


    const ctrMetricEl = document.querySelector('.js-front-page-ctr');
    const keenContainer = new Keen.Dataviz()
        .title('CTR')
        .chartOptions({
            suffix: '%',
            width: '100%'
        })
        .colors(['#49c5b1'])
        .el(ctrMetricEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-ctr-chart');

    promiseOfData
    .then((data) => {


    drawMetric(data, keenContainer, 'ctr');


       drawGraph(data, trendEl, 'ctr', {
            title: 'Homepage CTR',
            vAxis: {
                title: 'CTR (%)'
            }
       });

    });
}

module.exports = {
    render
};
