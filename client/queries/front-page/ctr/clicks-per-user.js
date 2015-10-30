/* global Keen */
'use strict';

const moment = require('moment');


const render = (el, promiseOfData) => {
    const percentageEl = document.createElement('div');
    percentageEl.classList.add('o-grid-row');
    percentageEl.innerHTML = '<h2 data-o-grid-colspan="12">Clicks per user</h2>';
    el.appendChild(percentageEl);

    const topLevelCharts = [
        {
            title: 'Today',
            colors: ['#49c5b1']
        },
        {
            title: 'Yesterday',
            colors: ['#91DCD0']
        }
    ].map(config => {
        const el = document.createElement('div');
        el.dataset.oGridColspan = '12 M6';
        percentageEl.appendChild(el);
        config.chart = new Keen.Dataviz()
            .el(el)
            .prepare();
        return config;
    });

    const trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    percentageEl.appendChild(trendEl);
    const trendChart = new Keen.Dataviz()
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
    .then(([, usersByDay, , , clicksByUserAndDay]) => {

        const clicksPerDay = clicksByUserAndDay.map((result) => (
            {
                clicks: result.value.reduce((prevVal, currentUser) => {
                    return prevVal + currentUser.result;
                }, 0)
            }
        ));

        topLevelCharts.forEach((topLevelChart, i) => {
            const clicksOnDay = clicksPerDay[clicksPerDay.length - i - 1].clicks;

            const usersOnDay = usersByDay[usersByDay.length - i - 1].value;
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
