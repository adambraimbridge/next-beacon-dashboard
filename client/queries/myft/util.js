/*global Keen, google */
'use strict';

var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);
var queryTimeframe = queryParameters.timeframe || "this_14_days";
var previousTimeframe  = queryTimeframe.replace('this', 'previous');

var queryRealUsers = function(options, timeshift) {
	var query = options.query || 'count_unique';
	var parameters = {
		eventCollection: options.eventCollection || "dwell",
		timeframe: options.timeframe || (timeshift ? previousTimeframe : queryTimeframe),
		targetProperty: options.targetProperty,
		timezone: "UTC",
		filters:options.filters || [],
		maxAge: 10800
	};

	if (options.groupBy) {
		parameters['groupBy'] = options.groupBy;
	}

	// Don't pass any interval parameter if it's explicitly set to false
	if (options.interval !== false) {
		parameters['interval'] = options.interval || queryParameters.interval || "daily";
	}

	return new Keen.Query(query, parameters);
};


function getValueExtractor (identifierProp) {
	return function (resultSet, identifier) {
		return (resultSet.result.find(r => r[identifierProp] === identifier) || {result: null}).result;
	};
}


module.exports = {
	queryRealUsers: queryRealUsers,
	getValueExtractor: getValueExtractor,
	fetch: function (client, queries) {

		var data = {
			this: {},
			prev: {},
			unique: {}
		};

		Object.keys(queries.compare).forEach(function (key) {
			data.this[key] = client.run(queryRealUsers(queries.compare[key]));
			data.prev[key] = client.run(queryRealUsers(queries.compare[key], true));
		});

		Object.keys(queries.unique).forEach(function (key) {
			data.unique[key] = client.run(queryRealUsers(queries.unique[key]));
		});

		return data;
	},


	drawMultiColumnChart: function ({title, data, id, v, h}) {
		var tabulatedData = new google.visualization.DataTable();

		tabulatedData.addColumn('string', h.label);

		data[0].values.forEach(function (val) {
			tabulatedData.addColumn('number', val.label);
		});

		tabulatedData.addRows(data.map(function (res) {
			return [res.label].concat(res.values.map(v => v.result));
		}));

		var options = {
			title: title,
			annotations: {
				alwaysOutside: true,
				textStyle: {
					fontSize: 14,
					color: '#000',
					auraColor: 'none'
				}
			},
			hAxis: {
				title: h.title,
				viewWindow: {
					min: [7, 30, 0],
					max: [17, 30, 0]
				}
			},
			vAxis: v
		};

		var chart = new google.visualization.ColumnChart(document.getElementById(id));
		chart.draw(tabulatedData, options);
	}

};
