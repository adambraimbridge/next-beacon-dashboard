/* global Keen */
'use strict';

var moment = require('moment');


var render = (el, promiseOfData) => {
    var percentageEl = document.createElement('div');
    percentageEl.classList.add('o-grid-row');
    percentageEl.innerHTML = '<h2 data-o-grid-colspan="12">Percentage of visitors who clicked on something</h2>';
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
    .then(([, usersByDay, , , clicksByUserAndDay]) => {

        topLevelCharts.forEach((topLevelChart, i) => {
            var clicksByUserOnDay = clicksByUserAndDay.slice(-1 - i).shift();
            var uniqueClicksOnDay = clicksByUserOnDay.value.filter((user) => {
                return user.result > 0;
            }).length;
            var usersOnDay = usersByDay.slice(-1 - i).shift().value;

            topLevelChart.chart
                .data({
                    result: parseFloat(((100 / usersOnDay) * uniqueClicksOnDay).toFixed(1))
                })
                .title(topLevelChart.title)
                .colors(topLevelChart.colors)
                .render();
        });
        trendChart
            .data({
                result: clicksByUserAndDay.map((result, index) => ({
                    value: parseFloat(((100 / usersByDay[index].value) * result.value.filter((user) => {
                        return user.result > 0;
                    }).length).toFixed(1)),
                    timeframe: result.timeframe
                }))
            })
            .render();

    });

};

module.exports = {
    render
};
