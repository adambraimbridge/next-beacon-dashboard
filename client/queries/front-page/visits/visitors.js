'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var visitorsEl = document.createElement('div');
    visitorsEl.innerHTML = '<h2 data-o-grid-colspan="12">Front page visitors yesterday</h2>';
    el.appendChild(visitorsEl);

    var pageViewsQueries = [
        new Keen.Query('count_unique', {
            eventCollection: 'dwell',
            targetProperty: 'user.uuid',
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
        new Keen.Query('count_unique', {
            eventCollection: 'dwell',
            targetProperty: 'user.uuid',
            timeframe: 'yesterday',
            timezone: 'UTC'
        })
    ];

    var totalEl = document.createElement('div');
    totalEl.dataset.oGridColspan = '12 M6';
    visitorsEl.appendChild(totalEl);
    var totalChart = new Keen.Dataviz()
        .el(totalEl)
        .prepare();
    var percentageEl = document.createElement('div');
    percentageEl.dataset.oGridColspan = '12 M6';
    visitorsEl.appendChild(percentageEl);
    var percentageChart = new Keen.Dataviz()
        .el(percentageEl)
        .prepare();

    client.run(pageViewsQueries, (err, results) => {
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
            .title('Percentage of site-wide visitors')
            .render();
    });

};

module.exports = {
    render
};
