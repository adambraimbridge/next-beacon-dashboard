/* global Keen */
'use strict';

import client from '../../lib/wrapped-keen';
import queryString from 'querystring';

const queryParameters = queryString.parse(location.search);
const queryTimeframe  = queryParameters.timeframe || "this_14_days"; // TODO: Set the proper value for this

export function render() {

	Dashboard.visualizePageViewsPerSession();
	//Dashboard.visualizeClicksPerVisit();
	//Dashboard.visualizeTotalSubscriptions();
}

class Dashboard {

	static visualizePageViewsPerSession() {
		visualize( AveragePageViewsPerSession.on('variant'), /* into -> */ Slot.at('#apv-variant-slot') );
		visualize( AveragePageViewsPerSession.on('control'), /* into -> */ Slot.at('#apv-control-slot') );
	}

	static visualizeClicksPerVisit() {
		visualize( ClicksPerVisit.on('variant'), /* into -> */ Slot.at('#apv-variant') );
		visualize( ClicksPerVisit.on('control'), /* into -> */ Slot.at('#apv-control') );
	}

	static visualizeTotalSubscriptions() {
		visualize( TotalSubscriptions.on('variant'), /* into -> */ Slot.at('#ts-variant-slot') );
		visualize( TotalSubscriptions.on('control'), /* into -> */ Slot.at('#ts-control-slot') );
	}
}

//=============================================================================================//
// UTILITIES
//=============================================================================================//

function visualize(metric, slot) {

	slot.prepare();

	metric.fetchData()
		.then(metric.prepDataForVisualisation)
		.then(renderDataIntoSlot);

	function renderDataIntoSlot(data) {
		slot.render(data)
	}
}

function promise() {
	return Promise.resolve();
}

//=============================================================================================//
// OBJECTS
//=============================================================================================//

class AveragePageViewsPerSession {

	static on(group) {
	    return new AveragePageViewsPerSession(group);
	}

	constructor(group) {
	    this.group = group;
	}

	fetchData() {
		const self = this;

		return promise()
			.then(prepQuery)
			.then(submitQueryToKeen);

		function prepQuery() {
			return new Keen.Query('count', Object.assign({
				eventCollection: 'dwell',
				filters: [
					{
						operator: 'eq',
						property_name: 'ab.propensityMessaging',
						property_value: self.group
					}
				],
				groupBy: 'ingest.device.spoor_session',
				timeframe: queryTimeframe,
				timezone: 'UTC'
			}));
		}

		function submitQueryToKeen(query) {
			return new Promise(resolve => {
				client.run([query], (err, results) => {
					resolve(results.result);
				});
			})
		}
	}

	prepDataForVisualisation(items) {
		return averageOf(items);

		function averageOf(items) {
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
	static at(selector) {
	    return new Slot(document.querySelector(selector));
	}

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