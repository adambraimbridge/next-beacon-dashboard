/* global Keen */
'use strict';


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


    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .title('Users')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d',
                title: 'Date'
            },
            vAxis: {
                title: 'Number of users that visited Front Page'
            },
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();


       promiseOfData
       .then((data) => {



        usersMetric
            .data({
                result: data[data.length-1].byLayout.total.users
            })
            .render();

        const trend = data.map((result, index) => ({
            value: Object.values(_.mapValues(result.byLayout, (dataForLayout, layout) => ({
                category: layout,
                result: dataForLayout.users
            }))),
            timeframe: result.timeframe
        }));

        trendChart
            .data({
                result: trend
            })
            .render();

    });

};

module.exports = {
    render
};
