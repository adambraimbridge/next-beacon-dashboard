/* global Keen */
'use strict';


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


    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .height(450)
        .title('Average clicks per user on the Homepage')
        .chartOptions({
            hAxis: {
                format: 'EEE d',
                title: 'Date'
            },
            vAxis: {
                title: 'Average clicks per front-page user'
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

        clicksPerUserMetric
            .data({
                result: data[data.length-1].byLayout.total.clicksPerUser
            })
            .render();

        const trend = data.map((result, index) => ({
            value: Object.values(_.mapValues(result.byLayout, (dataForLayout, layout) => ({
                category: layout,
                result: dataForLayout.clicksPerUser
            }))),
            timeframe: result.timeframe
        }));

        console.log('cpu', trend);

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
