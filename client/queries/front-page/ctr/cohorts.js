/* global Keen */
'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var cohortsEl = document.createElement('div');
    cohortsEl.classList.add('o-grid-row');
    cohortsEl.innerHTML = '<h2 data-o-grid-colspan="12">Percentage of visitors who click on something X times</h2>';
    el.appendChild(cohortsEl);

    var cohortsGraphEl = document.createElement('div');
    cohortsGraphEl.dataset.oGridColspan = '12';
    cohortsEl.appendChild(cohortsGraphEl);
    var cohortsGraph = new Keen.Dataviz()
        .chartType('areachart')
        .el(cohortsGraphEl)
        .height(450)
        .chartOptions({
            isStacked: true,
            hAxis: {
                format: 'EEEE'
            }
        })
        .prepare();

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
        var cohortResults = results.result.map(result => {
            var newValue = new Array(0, 0, 0, 0, 0);
            var rest = 0;
            result.value.forEach(value => {
                if (value.result < newValue.length) {
                    newValue[value.result] += 1;
                } else {
                    rest += 1;
                }
            });
            var newResult = Object.assign({}, result);
            newResult.value = newValue.map((value, i) => ({
                clicks: i,
                result: (100 / result.value.length) * value
            }));
            newResult.value.push({
                clicks: `${newValue.length} or more`,
                result: (100 / result.value.length) * rest
            });
            return newResult;
        });
        var cohortsEl = document.createElement('div');
        cohortsEl.dataset.oGridColspan = '12';
        el.appendChild(cohortsEl);
        cohortsGraph
            .data({ result: cohortResults })
            .render();
    });
};

module.exports = {
    render
};
