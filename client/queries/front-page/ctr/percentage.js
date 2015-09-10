/* global Keen */
'use strict';

var moment = require('moment');
var client = require('../../../lib/wrapped-keen');

var render = el => {
    var percentageEl = document.createElement('div');
    percentageEl.innerHTML = '<h2>Percentage of unique visitors to the front page who clicked on something</h2>';
    el.appendChild(percentageEl);

    var percentageSteps = [
        {
            eventCollection: 'dwell',
            actorProperty: 'user.uuid',
            filters: [
                {
                    operator: 'eq',
                    property_name: 'url.type',
                    property_value: 'frontpage'
                }
            ]
        },
        {
            eventCollection: 'cta',
            actorProperty: 'user.uuid',
            filters: [
                {
                    operator: 'eq',
                    property_name: 'url.type',
                    property_value: 'frontpage'
                },
                {
                    operator: 'in',
                    property_name: 'meta.nodeName',
                    property_value: ['a', 'button']
                }
            ]
        }
    ];
    // go back 7 days
    var percentageConfigs = [6, 5, 4, 3, 2, 1, 0]
        .map(i => ({
            stepOpts: {
                timeframe: {
                    start: moment().subtract(i + 1, 'days').format('YYYY-MM-DDT00:00:00.000+00:00'),
                    end: moment().subtract(i, 'days').format('YYYY-MM-DDT00:00:00.000+00:00')
                }
            }
        }));
    var percentageQueries = percentageConfigs.map(config => new Keen.Query('funnel', {
        steps: percentageSteps.map(step => Object.assign({}, step, config.stepOpts))
    }));

    // two top level numbers for yesterday and day before
    var topLevelCharts = [
        {
            title: moment().subtract(2, 'days').format('dddd'),
            colors: ['#91DCD0']
        },
        {
            title: 'Yesterday',
            colors: ['#49c5b1']
        }
    ]
        .map(config => {
            var el = document.createElement('div');
            el.dataset.oGridColspan = '12 M6';
            percentageEl.appendChild(el);
            config.chart = new Keen.Dataviz()
                .el(el)
                .prepare();
            return config;
        });
    var trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    percentageEl.appendChild(trendEl);
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
    // run the query
    client.run(percentageQueries, (err, results) => {
        topLevelCharts.forEach((topLevelChart, i) => {
            var result = results.slice(-(topLevelCharts.length) + i).shift();
            topLevelChart.chart
                .data({
                    result: parseFloat(((100 / result.result[0]) * result.result[1]).toFixed(1))
                })
                .title(topLevelChart.title)
                .colors(topLevelChart.colors)
                .render();
        });
        trendChart
            .data({
                result: results.map((result, index) => ({
                    value: parseFloat(((100 / result.result[0]) * result.result[1]).toFixed(1)),
                    timeframe: percentageConfigs[index].stepOpts.timeframe
                }))
            })
            .render();
    });
};

module.exports = {
    render
};