/* global Keen */
'use strict';


const render = (el, promiseOfData, friendlyChosenPeriod) => {

    const viewsEl = document.querySelector('.js-front-page-views');

    const viewsMetric = new Keen.Dataviz()
        .title(`Visits ${friendlyChosenPeriod}`)
        .chartOptions({
            width: '100%'
        })
        .colors(['#eeeeee'])
        .el(viewsEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-views-chart');


    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .title('Visits')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d'
            },
            curveType:'function',
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();


    promiseOfData
    .then(([, , viewsByDay]) => {


        const viewsToday = viewsByDay[viewsByDay.length - 1].value;

        viewsMetric
            .data({
                result: viewsToday
            })
            .render();

        trendChart
            .data({
                result: viewsByDay
            })
            .render();

    });

};

module.exports = {
    render
};
