/* global Keen, $ */

'use strict';

const percentage = require('./ctr/percentage');
const clicksPerUser = require('./ctr/clicks-per-user');
const users = require('./ctr/users');
const views = require('./ctr/views');
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

  const clicksByUserAndDay = new Keen.Query('count', {
      eventCollection: 'cta',
      filters: defaultFilters.concat(filter.isAClick),
      groupBy: 'user.uuid',
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 600
  });

  const viewsByDay = new Keen.Query('count', {
      eventCollection: 'dwell',
      filters: defaultFilters,
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 600
  });
  return Promise.all([
      client.run(usersOnHomepageByDay).then(res => res.result),
      client.run(clicksByUserAndDay).then(res => res.result),
      client.run(viewsByDay).then(res => res.result)
  ]);;
}


const render = () => {
  const el = document.getElementById('charts');
  const timeframe = queryParameters['timeframe'] || 'this_30_days';
  const interval = timeframe.indexOf('week') > 0 ? 'weekly' : 'daily';
  const friendlyChosenPeriod = timeframe.indexOf('this_') >= 0 ?
    (interval === 'daily' ? 'today' : 'this week') :
    (interval === 'daily' ? 'yesterday' : 'last week');

  const promiseOfData = getDataForTimeframe(timeframe, interval);

  percentage.render(el, promiseOfData, friendlyChosenPeriod);
  clicksPerUser.render(el, promiseOfData, friendlyChosenPeriod);
  users.render(el, promiseOfData, friendlyChosenPeriod);
  views.render(el, promiseOfData, friendlyChosenPeriod);


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
