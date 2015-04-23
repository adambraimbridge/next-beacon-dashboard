/*global $*/
'use strict';

var Rickshaw = require('rickshaw');
require('isomorphic-fetch');
require('es6-promise').polyfill();
var _ = require('lodash');

module.exports.init = function () {
	fetch('/api/funnel' + location.search, { credentials: 'same-origin' })
		.then(function(response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function(data) {
			if(data.code) {
				throw new Error(data.code + ': ' + data.message);
			}

			return data;
		})
		.then(function(data) {

			var palette = new Rickshaw.Color.Palette();
			var total = data.result[0];
			var graphSpec = {
				series: [{
					data: data.result.map(function (result, index) {
						return {
							x: index + 1,
							y: (100 / total) * result
						};
					}),
					color: palette.color(),
					name: 'Percentage of first step'
				}]
			};

			var graph = new Rickshaw.Graph(_.extend({
				element: document.querySelector("#chart"),
				width: document.querySelector("#chart").parentNode.offsetWidth * 0.9,
				height: window.innerHeight * 0.5,
				renderer: 'bar'
			}, graphSpec));

			new Rickshaw.Graph.Axis.Y({
				graph: graph,
				orientation: 'left',
				element: document.getElementById('y_axis')
			});

			new Rickshaw.Graph.HoverDetail({
				graph: graph,
				xFormatter: function (x) {
					return data.descriptions[x - 1];
				}
			});

			graph.render();
		})
		.catch(function (e) {
			$('<div>')
				.addClass('alert alert-danger')
				.text(e.message || e.toString())
				.prependTo('#chart_container');
		});
};
