/* global Keen, $, _ */

'use strict';

// const percentage = require('./ctr/percentage');
// const clicksPerUser = require('./ctr/clicks-per-user');
// const users = require('./ctr/users');
// const views = require('./ctr/views');
const client = require('../../lib/wrapped-keen');
const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const drawGraph = require('./ctr/draw-graph');
const drawMetric = require('./ctr/draw-metric');

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

  const views = new Keen.Query('count', {
      eventCollection: 'dwell',
      filters: defaultFilters,
      groupBy: ['ingest.user.layout', 'user.uuid'],
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const clicks = new Keen.Query('count', {
      eventCollection: 'cta',
      filters: defaultFilters.concat(filter.isAClick),
      groupBy: ['ingest.user.layout', 'user.uuid', 'meta.domPath'],
      timeframe: timeframe,
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  return Promise.all([
    client.run(views).then(res => res.result),
    client.run(clicks).then(res => res.result)
  ]).then(([ views, clicks ]) => {

    //components = [] or []
    return function(components, layouts) {
      //for each day
      return clicks.map((day, index) => {

        let linesToShow = [];
        if(!components.length) {
          components = ['all'];
        }
        if(!layouts.length) {
          layouts = ['all'];
        }

        if(components.length > 1) {
          components.forEach(component => {
            linesToShow.push({
              component: component,
              layout: layouts && layouts[0] ? layouts[0] : 'all'
            });
          });
        } else {
          components.forEach(component => {
            layouts.forEach(layout => {
              linesToShow.push({
                component: component,
                layout: layout
              });
            });
          });
        }

        return linesToShow.map(line => {
            const filterMatches = (data) => {
              let isMatch = data.result > 0;
              if(data['meta.domPath'] && line.component && line.component !== 'all') {
                  isMatch = isMatch && (data['meta.domPath'].indexOf(line.component) === 0);
              }
              if(data['ingest.user.layout'] && line.layout && line.layout !== 'all') {
                isMatch = isMatch && (data['ingest.user.layout'] === line.layout);
              }

              return isMatch
            }

            const matchingClicks = day.value.filter(filterMatches);
            const matchingViews = views[index].value.filter(filterMatches);
            const totalViews = matchingViews.reduce((prev, curr) => (prev + curr.result), 0);

            const clicks = matchingClicks.reduce((prev, curr) => (prev + curr.result), 0);
            const uniqueClickers = Object.keys(_.chain(matchingClicks).groupBy('user.uuid').value());
            const uniqueUsers = Object.keys(_.chain(matchingViews).groupBy('user.uuid').value());

            return {
              component: line.component,
              layout: line.layout,
              timeframe: day.timeframe,
              clicks: clicks,
              uniqueClicks: uniqueClickers.length,
              users: uniqueUsers.length,
              views: totalViews,
              ctr: parseFloat(((100 / uniqueUsers.length) * uniqueClickers.length).toFixed(1)),
              clicksPerUser: parseFloat((clicks / (uniqueUsers.length || 0)).toFixed(1))
            };

        });
      });
    };
  });
}


const render = () => {
  const el = document.getElementById('charts');
  const timeframe = queryParameters['timeframe'] || 'this_30_days';
  const interval = timeframe.indexOf('week') > 0 ? 'weekly' : 'daily';

  const promiseOfData = getDataForTimeframe(timeframe, interval);
  const metrics = [{
      id: 'ctr',
      title: 'CTR',
      metricConfig: {
        suffix: '%'
      },
      chartConfig: {}
    }, {
      id: 'clicksPerUser',
      title: 'Clicks per user',
      metricConfig: {},
      chartConfig: {}
    },
    {
      id: 'users',
      title: 'Homepage Users',
      metricConfig: {},
      chartConfig: {}
    },
    {
      id: 'views',
      title: 'Homepage Page Views',
      metricConfig: {},
      chartConfig: {}
    },
  ];

  metrics.forEach(metric => {

    metric.keenMetricContainer = new Keen.Dataviz()
      .title(metric.title)
      .chartOptions(Object.assign({
          width: '100%'
      }, metric.metricConfig))
      .colors(['#49c5b1'])
      .el(document.querySelector(`.js-front-page-metric[data-metric="${metric.id}"]`))
      .prepare();

    metric.chartEl = new Keen.Dataviz()
        .el(document.querySelector(`.js-front-page-chart[data-metric="${metric.id}"]`))
        .chartType('linechart')
        .title(metric.title)
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d',
                title: 'Date'
            },
            vAxis: {
                title: metric.title
            },
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();
  });
  // percentage.render(el, promiseOfData);


  promiseOfData.then(query => {


    const draw = () => {
      const components = Array.from(document.querySelectorAll('.js-toggle-components:checked') || []).map((el) => el.getAttribute('data-component')).filter(comp => !!comp);
      const layouts = Array.from(document.querySelectorAll('.js-toggle-layout:checked') || []).map((el) => el.getAttribute('data-layout')).filter(layout => !!layout);

      const data = query(components, layouts);
      console.log(components, layouts, 'data', data);
      metrics.forEach((metricConfig) => {
        drawMetric(data, metricConfig);
        drawGraph(data, metricConfig);
      });

    }

    draw();




    $('.js-front-page-toggles').removeClass('is-hidden');

    $('.js-front-page-toggles .toggle-line').change(draw);

  });


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
