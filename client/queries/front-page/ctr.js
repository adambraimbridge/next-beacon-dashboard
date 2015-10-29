/* global Keen */

'use strict';

var cta = require('./ctr/cta');
var percentage = require('./ctr/percentage');
var cohorts = require('./ctr/cohorts');
var clicksPerUser = require('./ctr/clicks-per-user');
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

    const usersOnHomepage = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'dwell',
        filters: filter.isOnHomepage,
        timeframe: timeframe,
        timezone: 'UTC',
        maxAge: 300
    });

    const usersOnHomepageByDay = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'dwell',
        filters: filter.isOnHomepage,
        timeframe: timeframe,
        interval: 'daily',
        timezone: 'UTC',
        maxAge: 300
    });

    const uniqueClicksByDomPath = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        timezone: 'UTC',
        maxAge: 300
    });

    const clicksByDomPath = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'meta.domPath',
        timeframe: timeframe,
        timezone: 'UTC',
        maxAge: 300
    });

    const clicksByUserAndDay = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'user.uuid',
        timeframe: timeframe,
        timezone: 'UTC',
        interval: 'daily',
        maxAge: 300
    });

    return Promise.all([
        client.run(usersOnHomepage).then(res => res.result),
        client.run(usersOnHomepageByDay).then(res => res.result),
        client.run(uniqueClicksByDomPath).then(res => res.result),
        client.run(clicksByDomPath).then(res => res.result),
        client.run(clicksByUserAndDay).then(res => res.result)
    ]);;
}


var render = () => {
	var el = document.getElementById('charts');
	const promiseOfData = getDataForTimeframe('this_7_days');
	percentage.render(el, promiseOfData);
	clicksPerUser.render(el, promiseOfData);
	cohorts.render(el, promiseOfData);
	cta.render(el, promiseOfData);

};

module.exports = {
	render
};
