/* global Keen */

'use strict';

const componentBreakdown = require('./ctr/component-breakdown');
const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));

const filter = {
    isOnHomepage: [{
        operator: 'eq',
        property_name: 'page.location.type',
        property_value: 'frontpage'
    }],
    isAClick: [{
        operator: 'in',
        property_name: 'meta.nodeName',
        property_value: ['a', 'button']
    },
    {
        operator: 'exists',
        property_name: 'meta.domPath',
        property_value: true
    }],
    layout: [{
      operator: 'eq',
      property_name: 'ingest.user.layout',
      property_value: queryParameters['layout']
    }]
}

const getDataForTimeframe = (timeframe, interval) => {

    let defaultFilters = filter.isOnHomepage;
    if(queryParameters['layout']) {
        defaultFilters = defaultFilters.concat(filter.layout);
    }

    const usersOnHomepageByDay = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'dwell',
        filters: defaultFilters,
        timeframe: timeframe,
        interval: interval,
        timezone: 'UTC',
        maxAge: 600
    });

    const uniqueClicksByDomPath = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'cta',
        filters: defaultFilters.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        interval: interval,
        timezone: 'UTC',
        maxAge: 600
    });

    const clicksByDomPath = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: defaultFilters.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        interval: interval,
        timezone: 'UTC',
        maxAge: 600
    });

    return Promise.all([
        client.run(usersOnHomepageByDay).then(res => res.result),
        client.run(uniqueClicksByDomPath).then(res => res.result),
        client.run(clicksByDomPath).then(res => res.result)
    ]);
}


const render = () => {
	const el = document.getElementById('charts');
    const timeframe = queryParameters['timeframe'] || 'this_30_days';
    const interval = timeframe.indexOf('week') > 0 ? 'weekly' : 'daily';

	const promiseOfData = getDataForTimeframe(timeframe, interval);
    const friendlyChosenPeriod = timeframe.indexOf('this_') >= 0 ?
        (interval === 'daily' ? 'today' : 'this week') :
        (interval === 'daily' ? 'yesterday' : 'last week');

	componentBreakdown.render(el, promiseOfData, friendlyChosenPeriod);

};

module.exports = {
	render
};
