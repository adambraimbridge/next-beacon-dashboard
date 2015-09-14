/* global Keen */
'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var query = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: [
            {
                operator: 'eq',
                property_name: 'page.location.type',
                property_value: 'frontpage'
            },
            {
                operator: 'exists',
                property_name: 'user.uuid',
                property_value: true
            }
        ],
        groupBy: 'user.uuid',
        timeframe: 'previous_7_days',
        interval: 'daily',
        timezone: 'UTC'
    });

    client.run(query, (err, results) => {
        results.result.forEach(result => {
            var newValue = new Array(0, 0, 0, 0, 0);
            var rest = 0;
            result.value.forEach(value => {
                if (value.result < newValue.length) {
                    newValue[value.result] += 1;
                } else {
                    rest += 1;
                }
            });
            result.value = newValue.map((value, i) => ({
                clicks: i,
                result: value
            }));
            result.value.push({
                clicks: `${newValue.length}+`,
                result: rest
            });
        });
        var cohortsEl = document.createElement('div');
        cohortsEl.dataset.oGridColspan = '12';
        el.appendChild(cohortsEl);
        new Keen.Dataviz()
            .chartType('areachart')
            .el(cohortsEl)
            .height(450)
            .chartOptions({
                isStacked: true,
                hAxis: {
                    format: 'EEEE'
                }
            })
            .prepare()
            .data(results)
            .render();
    });
};

module.exports = {
    render
};
