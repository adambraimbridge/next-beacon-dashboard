/* global Keen */
'use strict';

var moment = require('moment');
var client = require('../../../lib/wrapped-keen');
const weeks = 4;

var render = (el, type, queryType, queryOpts = {})  => {
    var pageViewsEl = document.createElement('div');
    pageViewsEl.classList.add('o-grid-row');
    pageViewsEl.innerHTML = `<h2 data-o-grid-colspan="12">Front page ${type} yesterday</h2>`;
    el.appendChild(pageViewsEl);

    var pageViewsQueries = [
        new Keen.Query(queryType, Object.assign({
            eventCollection: 'dwell',
            filters: [
                {
                    operator: 'eq',
                    property_name: 'page.location.type',
                    property_value: 'frontpage'
                }
            ],
            timeframe: `previous_${weeks * 7}_days`,
            interval: 'daily',
            timezone: 'UTC'
        }, queryOpts)),
        new Keen.Query(queryType, Object.assign({
            eventCollection: 'dwell',
            timeframe: `previous_${weeks * 7}_days`,
            interval: 'daily',
            timezone: 'UTC'
        }, queryOpts))
    ];

    var charts = new Map([['percentage'], ['total']]);
    charts.forEach((value, key, map) => {
        var el = document.createElement('div');
        el.dataset.oGridColspan = '12 M6';
        pageViewsEl.appendChild(el);
        map.set(key, new Keen.Dataviz()
            .el(el)
            .prepare()
        );
    });
    var trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    pageViewsEl.appendChild(trendEl);
    charts.set('trend', new Keen.Dataviz()
        .el(trendEl)
        .chartType('linechart')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEEE'
            }
        })
        .prepare()
    );

    client.run(pageViewsQueries, (err, results) => {
        var [frontPageResults, siteResults] = results.map(result => result.result);
        var frontPageDwellYesterday = frontPageResults.slice(-1).shift().value;
        var siteDwellYesterday = siteResults.slice(-1).shift().value;
        charts.get('percentage')
            .data({
                result: parseFloat(((100 / siteDwellYesterday) * frontPageDwellYesterday).toFixed(1))
            })
            .title(`Percentage of site-wide ${type}`)
            .render();
        charts.get('total')
            .data({
                result: frontPageDwellYesterday
            })
            .colors(['#91DCD0'])
            .title('Total')
            .render();
        // turn values into percentages
        var percentageTrendData = frontPageResults.map((result, i) =>
            Object.assign({}, result, {
                value:  [{
                    result: parseFloat(((100 / siteResults[i].value) * result.value).toFixed(1))
                }]
            })
        );
        // take this week...
        var trendData = percentageTrendData.slice(-7).map(result => {
            var trendResult = Object.assign({}, result);
            trendResult.value[0].category = 'This week';
            return trendResult;
        });
        // ...and overlay previous weeks
        percentageTrendData.slice(0, -7)
            .forEach((data, i, array) => {
                var weekBeginning = array[parseInt(i/7) * 7].timeframe.start;
                var value = data.value[0];
                value.category = `W/b ${moment(weekBeginning).format('Do MMM')}`;
                trendData[i % 7].value.splice(1, 0, value);
            });
        charts.get('trend')
            .data({
                result: trendData
            })
            .render();
    });

};

module.exports = {
    render
};
