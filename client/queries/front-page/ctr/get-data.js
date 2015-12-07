'use strict';

const moment = require('moment');
const client = require('../../../lib/wrapped-keen');

function daysAgo(n) {
  return moment.unix(moment().startOf('day').unix()-(n * 86400)).toDate();
}

const filter = {
    hasLayout: [{
      "operator":"exists",
      "property_name":"ingest.user.layout",
      "property_value":true
    },
    {
      "operator":"ne",
      "property_name":"ingest.user.layout",
      "property_value": ""
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
    }]
}


module.exports = (timeframe, interval, pageFilter) => {

  let defaultFilters = pageFilter;

  const users = new Keen.Query('count_unique', {
      eventCollection: 'dwell',
      target_property: 'user.uuid',
      filters: defaultFilters.concat(filter.hasLayout),
      groupBy: ['ingest.user.layout'],
      timeframe: {
      	start: daysAgo(28),
      	end: daysAgo(0)
      },
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const views = new Keen.Query('count', {
      eventCollection: 'dwell',
      filters: defaultFilters.concat(filter.hasLayout),
      groupBy: ['ingest.user.layout'],
      timeframe: {
      	start: daysAgo(28),
      	end: daysAgo(0)
      },
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const totalUsers = new Keen.Query('count_unique', {
      eventCollection: 'dwell',
      target_property: 'user.uuid',
      filters: defaultFilters,
      timeframe: {
      	start: daysAgo(28),
      	end: daysAgo(0)
      },
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const totalViews = new Keen.Query('count', {
      eventCollection: 'dwell',
      filters: defaultFilters,
      timeframe: {
      	start: daysAgo(28),
      	end: daysAgo(0)
      },
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  });

  const clicks = function(to, from) {
  	return new Keen.Query('count', {
      eventCollection: 'cta',
      filters: defaultFilters.concat(filter.isAClick),
      groupBy: ['ingest.user.layout', 'user.uuid', 'meta.domPath'],
      timeframe: {
      	start: daysAgo(from),
      	end: daysAgo(to)
      },
      timezone: 'UTC',
      interval: interval,
      maxAge: 3600
  	});
  }

  return Promise.all([
    client.run(users).then(res => res.result),
    client.run(views).then(res => res.result),
    client.run(totalUsers).then(res => res.result),
    client.run(totalViews).then(res => res.result),
    client.run(clicks(21,28)).then(res => res.result),
    client.run(clicks(14,21)).then(res => res.result),
    client.run(clicks(7,14)).then(res => res.result),
    client.run(clicks(0,7)).then(res => res.result)
  ]).then(([ users, views, totalUsers, totalViews, ...clicks ]) => {

  	clicks = _.flatten(clicks);
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
       			const matchingUsers = users[index].value.filter(filterMatches);

            const totalViewsCount = line.layout === 'all' ? totalViews[index].value : matchingViews.reduce((prev, curr) => (prev + curr.result), 0);
            const totalUsersCount = line.layout === 'all' ? totalUsers[index].value : matchingUsers.reduce((prev, curr) => (prev + curr.result), 0);

            const clicks = matchingClicks.reduce((prev, curr) => (prev + curr.result), 0);
            const uniqueClickers = Object.keys(_.chain(matchingClicks).groupBy('user.uuid').value());


            return {
              component: line.component,
              layout: line.layout,
              timeframe: day.timeframe,
              clicks: clicks,
              uniqueClicks: uniqueClickers.length,
              users: totalUsersCount,
              views: totalViewsCount,
              ctr: parseFloat(((100 / totalUsersCount) * uniqueClickers.length).toFixed(1)),
              clicksPerUser: parseFloat((clicks / totalUsersCount).toFixed(1))
            };

        });
      });
    };
  });
}
