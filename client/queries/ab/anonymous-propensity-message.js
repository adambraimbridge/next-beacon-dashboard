/* global Keen */
'use strict';

import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search);
const queryTimeframe  = queryParameters.timeframe || "this_14_days"; // TODO: Set the proper value for this

//=============================================================================================//
// MAIN
//=============================================================================================//

export function render() {
	visualize(AveragePageViewsPerSession);
	visualize(ClicksPerVisit);
	visualize(TotalSubscriptions);
}

//=============================================================================================//
// UTILITIES
//=============================================================================================//

function visualize(Metric) {
	const slots = [];

	prepViewSlotsFor(Metric)
			.then(Metric.fetchData)
			.then(Metric.prepDataForVisualisation)
			.then(loadDataIntoViewSlots);

	function prepViewSlotsFor(Metric) {
		return Promise.resolve()
			.then(getSlotElements)
			.then(prepSlotForEachElement);

		function getSlotElements() {
			return document.querySelectorAll(`[data-metric=${Metric.id}] [data-viz]`);
		}

		function prepSlotForEachElement(elements) {
			for(const element of elements) {
				const slot = new Slot(element);
				slot.prepare();
				slots.push(slot);
			}
		}
	}

	function loadDataIntoViewSlots( data:MetricData ) {
		for(const slot of slots) {
			slot.render(data.for(slot))
		}
	}
}

//=============================================================================================//
// OBJECTS
//=============================================================================================//

class AveragePageViewsPerSession {

	static id = 'average-page-views-per-session';

	static fetchData() {
		return Promise.all([
			fetchPageViewsPerSessionFor('variant'),
			fetchPageViewsPerSessionFor('control')
		])
		.then(results => {
			return {
				variant: results[0],
				control: results[1]
			}
		});

		function fetchPageViewsPerSessionFor(group) {
			return Promise.resolve()
				.then(prepQuery)
				.then(submitQueryToKeen);

			function prepQuery() {
				return new Keen.Query('count', Object.assign({
					eventCollection: 'dwell',
					filters: [
						{
							operator: 'eq',
							property_name: 'ab.propensityMessaging',
							property_value: group
						}
					],
					groupBy: 'ingest.device.spoor_session',
					timeframe: queryTimeframe,
					timezone: 'UTC'
				}))
			}

			function submitQueryToKeen(query) {
				return new Promise(resolve => {
					client.run([query], (err, results) => {
						resolve(results.result);
					});
				})
			}
		}
	}

	static prepDataForVisualisation(data) {
		return Promise.all([
			calculateAverageOf(data['variant']),
			calculateAverageOf(data['control'])
		])
		.then(returnDataAsMetricData);

		function calculateAverageOf(items) {
			return new Promise(resolve => {

				resolve(totalViews() / items.length);

				function totalViews() {
					let total = 0;
					for(const item of items) {
						total = total + item.result;
					}
					return total;
				}
			});
		}

		function returnDataAsMetricData(averages) {
			return new MetricData({
				variant:averages[0],
				control:averages[1]
			});
		}
	}
}


class ClicksPerVisit {

	static id = 'clicks-per-visit';

	static fetchData() {
		// TODO: Implement
	}

	static prepDataForVisualisation(data) {
		// TODO: Implement
		return new MetricData({variant:20, control:40})
	}
}

class TotalSubscriptions {

	static id = 'total-subscriptions';

	static fetchData() {
		// TODO: Implement
	}

	static prepDataForVisualisation(data) {
		// TODO: Implement
		return new MetricData({variant:0, control:250})
	}
}

class Slot {
	constructor(element) {
		this.id = element.dataset.viz;
	    this.instance = new Keen.Dataviz().el(element).title(element.dataset.vizTitle);
		if(element.dataset.vizColors) {
			this.instance.colors(element.dataset.vizColors.split(','))
		}
	}

	prepare() {
		this.instance.prepare();
	}
	render(data) {
		this.instance.data({ result: data }).render();
	}
}

class MetricData {
	constructor(data) {
		this.data = data || {};
	}

	for(slot) {
		return this.data[slot.id];
	}
}