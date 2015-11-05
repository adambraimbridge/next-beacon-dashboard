/* global Keen, _ */
'use strict';

const drawGraph = require('./draw-graph');

const render = (el, promiseOfData, friendlyChosenPeriod) => {


    const ctrMetricEl = document.querySelector('.js-front-page-ctr');
    const ctrMetric = new Keen.Dataviz()
        .title(`CTR ${friendlyChosenPeriod}`)
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


        ctrMetric
            .data({
                result: data[data.length-1].byLayout.total.ctr
            })
            .render();

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
