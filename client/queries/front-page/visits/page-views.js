'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var pageViewsEl = document.createElement('div');
    pageViewsEl.classList.add('o-grid-row');
    pageViewsEl.innerHTML = '<h2 data-o-grid-colspan="12">Front page views yesterday</h2>';
    el.appendChild(pageViewsEl);

    var pageViewsQueries = [
        new Keen.Query('count', {
            eventCollection: 'dwell',
            filters: [
                {
                    operator: 'eq',
                    property_name: 'url.type',
                    property_value: 'frontpage'
                }
            ],
            timeframe: 'previous_7_days',
            interval: 'daily',
            timezone: 'UTC'
        }),
        new Keen.Query('count', {
            eventCollection: 'dwell',
            timeframe: 'yesterday',
            timezone: 'UTC'
        })
    ];

    var percentageEl = document.createElement('div');
    percentageEl.dataset.oGridColspan = '12 M6';
    pageViewsEl.appendChild(percentageEl);
    var percentageChart = new Keen.Dataviz()
        .el(percentageEl)
        .prepare();
    var totalEl = document.createElement('div');
    totalEl.dataset.oGridColspan = '12 M6';
    pageViewsEl.appendChild(totalEl);
    var totalChart = new Keen.Dataviz()
        .el(totalEl)
        .prepare();
    var trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    pageViewsEl.appendChild(trendEl);
    var trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('linechart')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEEE'
            }
        })
        .prepare();

    client.run(pageViewsQueries, (err, results) => {
        var totalResult = results[0].result.slice(-1).shift().value;
        percentageChart
            .data({
                result: parseFloat(((100 / results[1].result) * totalResult).toFixed(1))
            })
            .title('Percentage of site-wide page views')
            .render();
        totalChart
            .data({
                result: totalResult
            })
            .colors(['#91DCD0'])
            .title('Total')
            .render();
        var trendData = results[0].result.map(result => {
            result.value = parseFloat(((100 / results[1].result) * result.value).toFixed(1));
            return result;
        });
        trendChart
            .data({
                result: trendData
            })
            .render();
    });

};

module.exports = {
    render
};
