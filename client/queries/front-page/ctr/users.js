/* global Keen */
'use strict';
const drawGraph = require('./draw-graph');


const render = (el, promiseOfData, friendlyChosenPeriod) => {

    const usersEl = document.querySelector('.js-front-page-users');

    const usersMetric = new Keen.Dataviz()
        .title(`HP users ${friendlyChosenPeriod}`)
        .chartOptions({
            width: '100%',
            animation: {
                startup: true
            }
        })
        .colors(['#eeeeee'])
        .el(usersEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-users-chart');

    promiseOfData
    .then((data) => {



        usersMetric
            .data({
                result: data[data.length-1].byLayout.total.users
            })
            .render();

        drawGraph(data, trendEl, 'users', {
            vAxis: {
                title: 'Number of users that visited Front Page'
            },
            title: 'Users'
        });

    });

};

module.exports = {
    render
};
