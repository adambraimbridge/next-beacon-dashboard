/* global Keen, $ */

'use strict';

const percentage = require('./ctr/percentage');
const clicksPerUser = require('./ctr/clicks-per-user');
const users = require('./ctr/users');
const views = require('./ctr/views');
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
        maxAge: 600
    });

    const usersOnHomepageByDay = new Keen.Query('count_unique', {
        targetProperty: 'user.uuid',
        eventCollection: 'dwell',
        filters: filter.isOnHomepage,
        timeframe: timeframe,
        interval: 'daily',
        timezone: 'UTC',
        maxAge: 600
    });

    const clicksByUserAndDay = new Keen.Query('count', {
        eventCollection: 'cta',
        filters: filter.isOnHomepage.concat(filter.isAClick),
        groupBy: 'user.uuid',
        timeframe: timeframe,
        timezone: 'UTC',
        interval: 'daily',
        maxAge: 600
    });

    const viewsByDay = new Keen.Query('count', {
        eventCollection: 'dwell',
        filters: filter.isOnHomepage,
        timeframe: timeframe,
        timezone: 'UTC',
        interval: 'daily',
        maxAge: 600
    });
    return Promise.all([
        client.run(usersOnHomepage).then(res => res.result),
        client.run(usersOnHomepageByDay).then(res => res.result),
        client.run(clicksByUserAndDay).then(res => res.result),
        client.run(viewsByDay).then(res => res.result)
    ]);;
}


const render = () => {
	const el = document.getElementById('charts');
	const promiseOfData = getDataForTimeframe('this_30_days');

	percentage.render(el, promiseOfData);
	clicksPerUser.render(el, promiseOfData);
	users.render(el, promiseOfData);
	views.render(el, promiseOfData);


 	if(!document.location.hash) {
		document.location.hash = '#front-page-ctr-chart'
	}

	const metric = document.querySelector(`.front-page__metric[href="${document.location.hash}"]`);
	if(metric) {
		metric.classList.add('is-selected');
	}

	$('.front-page__metric').on('click', (e) => {
		const selected = document.querySelector('.front-page__metric.is-selected');
		if(selected) {
			selected.classList.remove('is-selected');
		}
		e.currentTarget.classList.add('is-selected');
	});

};

module.exports = {
	render
};
