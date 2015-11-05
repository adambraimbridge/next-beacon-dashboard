/* global Keen, google, _ */
'use strict';

const drawGraph = require('./draw-graph');



const render = (el, promiseOfData, friendlyChosenPeriod) => {

    const clicksPerUserEl = document.querySelector('.js-front-page-clicks-per-user');

    const clicksPerUserMetric = new Keen.Dataviz()
        .title(`Average clicks per user ${friendlyChosenPeriod}`)
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

        clicksPerUserMetric
            .data({
                result: data[data.length-1].byLayout.total.clicksPerUser
            })
            .render();

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

