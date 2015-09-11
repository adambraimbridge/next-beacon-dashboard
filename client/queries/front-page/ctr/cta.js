/* global Keen */
'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var ctaEl = document.createElement('div');
    ctaEl.classList.add('o-grid-row');
    ctaEl.innerHTML = '<h2 data-o-grid-colspan="12">Most clicked elements in the past week</h2>';

    el.appendChild(ctaEl);

    var tableEl = document.createElement('table');
    tableEl.dataset.oGridColspan = '12';
    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Dom Path</th>
                <th>Clicks</th>
            </tr>
        </thead>
    `;
    ctaEl.appendChild(tableEl);

    var ctaQuery = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: [
            {
                operator: 'eq',
                property_name: 'page.location.type',
                property_value: 'frontpage'
            },
            {
                operator: 'exists',
                property_name: 'meta.domPath',
                property_value: true
            },
            {
                operator: 'in',
                property_name: 'meta.nodeName',
                property_value: ['a', 'button']
            }
        ],
        groupBy: 'meta.domPath',
        timeframe: 'previous_7_days',
        timezone: 'UTC'
    });
    client.run(ctaQuery, (err, results) => {
        var tableBodyEl = document.createElement('tbody');
        tableBodyEl.innerHTML = results.result
            .sort((resultOne, resultTwo) => resultTwo.result - resultOne.result)
            // show top 10
            .slice(0, 10)
            .map(result => `
                <tr>
                    <td><a href="https://next.ft.com/uk#domPath:${result['meta.domPath']}">${result['meta.domPath']}</a></td>
                    <td>${result.result}</td>
                </tr>
            `)
            .join('');
        tableEl.appendChild(tableBodyEl);
    });
};

module.exports = {
    render
};
