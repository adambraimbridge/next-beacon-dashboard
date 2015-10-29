/* global Keen */
'use strict';

var moment = require('moment');
var client = require('../../../lib/wrapped-keen');

var range = size => (new Array(size))
    .join()
    .split(',')
    .map((item, i) => i);

var render = (el, promiseOfData) => {
    var percentageEl = document.createElement('div');
    percentageEl.classList.add('o-grid-row');
    percentageEl.innerHTML = '<h2 data-o-grid-colspan="12">Clicks per user</h2>';
    el.appendChild(percentageEl);

    var topLevelCharts = [
        {
            title: 'Yesterday',
            colors: ['#49c5b1']
        },
        {
            title: moment().subtract(2, 'days').format('dddd'),
            colors: ['#91DCD0']
        }
    ].map(config => {
        var el = document.createElement('div');
        el.dataset.oGridColspan = '12 M6';
        percentageEl.appendChild(el);
        config.chart = new Keen.Dataviz()
            .el(el)
            .prepare();
        return config;
    });

    var trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    percentageEl.appendChild(trendEl);
    var trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('linechart')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d'
            }
        })
        .prepare();


    promiseOfData
    .then(([users, usersByDay, uniqueClicks, clicks, clicksByUserAndDay]) => {

        const clicksPerDay = clicksByUserAndDay.map((result, index) => (
            {
                clicks: result.value.reduce((prevVal, currentUser) => {
                    return prevVal + currentUser.result;
                }, 0)
            }
        ));

        topLevelCharts.forEach((topLevelChart, i) => {

            var clicksOnDay = clicksPerDay.slice(-1 -i).shift().clicks;

            var usersOnDay = usersByDay.slice(-1 - i).shift().value;

            topLevelChart.chart
                .data({
                    result: parseFloat((clicksOnDay / usersOnDay).toFixed(1))
                })
                .title(topLevelChart.title)
                .colors(topLevelChart.colors)
                .render();
        });

        trendChart
            .data({
                result: clicksPerDay.map((day, index) => ({
                    value: parseFloat((clicksPerDay[index].clicks / usersByDay[index].value).toFixed(1)),
                    timeframe: usersByDay[index].timeframe
                }))
            })
            .render();

    });

};

module.exports = {
    render
};
