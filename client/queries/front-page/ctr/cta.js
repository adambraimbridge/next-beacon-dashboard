/* global Keen */
'use strict';

var client = require('../../../lib/wrapped-keen');

var render = el => {
    var tables = {};
    [['components', 'Component name'], ['elements', 'Dom path']].forEach(config => {
        var [type, colTitle] = config;
        var containerEl = document.createElement('div');
        containerEl.classList.add('o-grid-row');
        containerEl.innerHTML = `<h2 data-o-grid-colspan="12">Most clicked ${type} in the past week</h2>`;
        el.appendChild(containerEl);

        var tableEl = document.createElement('table');
        tableEl.classList.add('table--front-page');
        tableEl.dataset.oGridColspan = '12';
        tableEl.innerHTML = `
            <thead>
                <tr>
                    <th>${colTitle}</th>
                    <th>Clicks</th>
                    <th>% of total clicks</th>
                </tr>
            </thead>
        `;
        containerEl.appendChild(tableEl);

        tables[type] = tableEl;
    });

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
        var totalClicks = results.result.reduce((total, result) => total + result.result, 0);

        var elementsTableBodyEl = document.createElement('tbody');
        elementsTableBodyEl.innerHTML = results.result
            .sort((resultOne, resultTwo) => resultTwo.result - resultOne.result)
            .map(result => `
                <tr class="table__body-row">
                    <td><a href="https://next.ft.com/uk#domPath:${result['meta.domPath']}">${result['meta.domPath']}</a></td>
                    <td>${result.result}</td>
                    <td>${((100 / totalClicks) * result.result).toFixed(2)}</td>
                </tr>
            `)
            .join('');

        var componentsTableBodyEl = document.createElement('tbody');
        // pull out the different 'components';
        componentsTableBodyEl.innerHTML = results.result
            .map(result => result['meta.domPath'].split(' | ')[0])
            .filter((componentName, i, componentNames) => componentNames.indexOf(componentName) === i)
            .map(componentName => ({
                name: componentName,
                // sum the clicks for this component
                value: results.result
                    .filter(result => result['meta.domPath'].split(' | ')[0] === componentName)
                    .reduce((total, result) => total + result.result, 0)
            }))
            .sort((componentOne, componentTwo) => componentTwo.value - componentOne.value)
            .map(component => {
                // prettify name
                var componentName = component.name.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase());
                return `
                    <tr class="table__body-row">
                        <td><a href="https://next.ft.com/uk#domPath:${component.name}">${componentName}</a></td>
                        <td>${component.value}</td>
                        <td>${((100 / totalClicks) * component.value).toFixed(2)}</td>
                    </tr>
                `;
            })
            .join('');
        tables['components'].appendChild(componentsTableBodyEl);

        // add show all buttons
        Object.keys(tables).forEach(tableType => {
            var table = tables[tableType];
            table.appendChild(elementsTableBodyEl);
            var showAllEl = document.createElement('button');
            showAllEl.classList.add('table__button--show-all');
            showAllEl.textContent = 'Show all';
            table.appendChild(showAllEl);
            table.addEventListener('click', function (ev) {
                var target = ev.target;
                if (target.classList.contains('table__button--show-all')) {
                    this.classList.add('table--show-all');
                    target.parentNode.removeChild(target);
                }
            });
        });
    });
};

module.exports = {
    render
};
