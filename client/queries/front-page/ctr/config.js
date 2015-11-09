'use strict';

module.exports = {
	pageFilter: [{
    operator: 'eq',
    property_name: 'page.location.type',
    property_value: 'frontpage'
	}],
	metrics: [{
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
    }
  ]
}
