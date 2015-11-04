/* global Keen, _ */
'use strict';

const render = (el, promiseOfData, friendlyChosenPeriod) => {


    const ctrMetricEl = document.querySelector('.js-front-page-ctr');
    const ctrMetric = new Keen.Dataviz()
        .title(`CTR ${friendlyChosenPeriod}`)
        .chartOptions({
            suffix: '%',
            width: '100%'
        })
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
    .then((data) => {


        ctrMetric
            .data({
                result: data[data.length-1].byLayout.total.ctr
            })
            .render();

        const trend = data.map((result, index) => ({
            value: Object.values(_.mapValues(result.byLayout, (dataForLayout, layout) => ({
                category: layout,
                result: dataForLayout.ctr
            }))),
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
