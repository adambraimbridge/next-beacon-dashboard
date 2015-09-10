'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var pageViewsEl = document.createElement('div');
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
            timeframe: 'yesterday',
            timezone: 'UTC'
        }),
        new Keen.Query('count', {
            eventCollection: 'dwell',
            timeframe: 'yesterday',
            timezone: 'UTC'
        })
    ];

    var totalEl = document.createElement('div');
    totalEl.dataset.oGridColspan = '12 M6';
    pageViewsEl.appendChild(totalEl);
    var totalChart = new Keen.Dataviz()
        .el(totalEl)
        .prepare();
    var percentageEl = document.createElement('div');
    percentageEl.dataset.oGridColspan = '12 M6';
    pageViewsEl.appendChild(percentageEl);
    var percentageChart = new Keen.Dataviz()
        .el(percentageEl)
        .prepare();

    client.run(pageViewsQueries, (err, results) => {
        console.log(results);
        console.log(results[0].result);
        totalChart
            .data({
                result: results[0].result
            })
            .title('Total')
            .render();
        percentageChart
            .data({
                result: parseFloat(((100 / results[1].result) * results[0].result).toFixed(1))
            })
            .colors(['#91DCD0'])
            .title('Percentage of site-wide page views')
            .render();
    });

};

module.exports = {
    render
};
