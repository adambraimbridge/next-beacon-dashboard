/* global Keen */

'use strict';

const componentBreakdown = require('./ctr/component-breakdown');
const client = require('../../lib/wrapped-keen');

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
    }]
}

const getDataForTimeframe = (timeframe) => {


    const usersOnHomepageByDay = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'dwell',
        filters: filter.isOnHomepage,
        timeframe: timeframe,
        interval: 'daily',
        timezone: 'UTC',
        maxAge: 600
    });

    const uniqueClicksByDomPath = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        interval: 'daily',
        timezone: 'UTC',
        maxAge: 600
    });

    const clicksByDomPath = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        interval: 'daily',
        timezone: 'UTC',
        maxAge: 600
    });

    return Promise.all([
        client.run(usersOnHomepageByDay).then(res => res.result),
        client.run(uniqueClicksByDomPath).then(res => res.result),
        client.run(clicksByDomPath).then(res => res.result)
    ]);;
}


const render = () => {
	const el = document.getElementById('charts');
	const promiseOfData = getDataForTimeframe('this_30_days');

	componentBreakdown.render(el, promiseOfData);

};

module.exports = {
	render
};
