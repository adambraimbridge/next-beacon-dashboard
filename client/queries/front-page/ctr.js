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
    hasUUID: [{
      "operator":"exists",
      "property_name":"user.uuid",
      "property_value":true
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
      groupBy: ['ingest.user.layout'],
      filters: defaultFilters,
      timeframe: timeframe,
      interval: interval,
      timezone: 'UTC',
      maxAge: 3600
  });

  const clicksByUserAndDay = new Keen.Query('count', {
      eventCollection: 'cta',
      filters: defaultFilters.concat(filter.isAClick),
      groupBy: ['ingest.user.layout', 'user.uuid'],
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const viewsByDay = new Keen.Query('count', {
      eventCollection: 'dwell',
      filters: defaultFilters,
      groupBy: ['ingest.user.layout'],
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });
  return Promise.all([
      client.run(usersOnHomepageByDay).then(res => res.result),
      client.run(clicksByUserAndDay).then(res => res.result),
      client.run(viewsByDay).then(res => res.result)
  ]).then(([ usersByDay, clicksByUserAndDay, viewsByDay ]) => {

    return clicksByUserAndDay.map((day, index) => {

          const byLayout = _.chain(day.value).groupBy('ingest.user.layout').mapValues((users, layout) => {
              const usersByLayout = _.chain(usersByDay[index].value).groupBy('ingest.user.layout').mapValues((users) => users[0].result).value();
              const viewsByLayout = _.chain(viewsByDay[index].value).groupBy('ingest.user.layout').mapValues((users) => users[0].result).value();
              const onlyClickers = users.filter((user) => user.result > 0);
              const clicks = onlyClickers.reduce((prev, curr) => prev + curr.result, 0);
              return {
                  clicks: clicks,
                  uniqueClicks: onlyClickers.length,
                  users: usersByLayout[layout] || 0,
                  views: viewsByLayout[layout] || 0,
                  ctr: parseFloat(((100 / usersByLayout[layout]) * onlyClickers.length).toFixed(1)),
                  clicksPerUser: parseFloat((clicks /  (usersByLayout[layout] || 0)).toFixed(1))
              }
          }).omit('null','').value();

          byLayout.total = _.chain(byLayout).values().value().reduce((prev, curr) => ({
              clicks: prev.clicks + curr.clicks,
              uniqueClicks: prev.uniqueClicks + curr.uniqueClicks,
              users: prev.users + curr.users,
              views: prev.views + curr.views
          }), { clicks: 0, uniqueClicks: 0, users: 0, views: 0});

          byLayout.total.ctr = parseFloat(((100 / byLayout.total.users) * byLayout.total.uniqueClicks).toFixed(1));
          byLayout.total.clicksPerUser = parseFloat((byLayout.total.clicks /  byLayout.total.users).toFixed(1));

          return {
              timeframe: day.timeframe,
              byLayout: byLayout
          };
        });

  });
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
