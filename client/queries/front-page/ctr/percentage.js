/* global Keen */
'use strict';

const render = (el, promiseOfData, friendlyChosenPeriod) => {


    const ctrMetricEl = document.querySelector('.js-front-page-ctr');
    const ctrMetric = new Keen.Dataviz()
        .title(`CTR ${friendlyChosenPeriod}`)
        .chartOptions({
            suffix: '%',
            width: '100%'
        })
        .title('Homepage CTR')
        .colors(['#49c5b1'])
        .el(ctrMetricEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-ctr-chart');

    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .title('Homepage CTR')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d',
                title: 'Date'
            },
            vAxis: {
                title: 'CTR (%)'
            },
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();


    promiseOfData
    .then((
        [ usersByDay,
        clicksByUserAndDay,
         , //viewsByDay
        ]) => {


        const clicksByUserOnDay = clicksByUserAndDay[clicksByUserAndDay.length - 1];
        const uniqueClicksOnDay = clicksByUserOnDay.value.filter((user) => {
            return user.result > 0;
        }).length;
        const usersOnDay = usersByDay[usersByDay.length - 1].value;

        ctrMetric
            .data({
                result: parseFloat(((100 / usersOnDay) * uniqueClicksOnDay).toFixed(1))
            })
            .render();

        const trend = clicksByUserAndDay.map((result, index) => ({
            value: parseFloat(((100 / usersByDay[index].value) * result.value.filter((user) => {
                return user.result > 0;
            }).length).toFixed(1)),
            timeframe: result.timeframe
        }));

        trendChart
            .data({
                result: trend

            }).render();

    });
}

module.exports = {
    render
};
