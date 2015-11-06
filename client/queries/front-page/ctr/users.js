/* global Keen */
'use strict';
const drawGraph = require('./draw-graph');
const drawMetric = require('./draw-metric');


const render = (el, promiseOfData) => {

    const usersEl = document.querySelector('.js-front-page-users');

    const keenContainer = new Keen.Dataviz()
        .title('Users')
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



        drawMetric(data, keenContainer, 'users');


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
