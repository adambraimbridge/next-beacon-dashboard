/* global Keen */
'use strict';

import keen from '../../lib/wrapped-keen';
import queryString from 'querystring';

const defaultTimeframe = { start: '2015-11-14T00:00:00.000+00:00', end: '2015-11-19T00:00:00.000+00:00'};
const queryParameters = queryString.parse(location.search);
const queryTimeframe  = queryParameters.timeframe || defaultTimeframe;

export function render() {

	Dashboard.visualize({
		 count : average,
		metric : PageViewsPerSession.on('variant'),
		  slot : Slot.at('#apv-variant-slot')
	});

	Dashboard.visualize({
		 count : average,
		metric : PageViewsPerSession.on('control'),
		  slot : Slot.at('#apv-control-slot')
	});

	Dashboard.visualize({
		 count : average,
		metric : ClicksPerVisit.on('variant'),
		  slot : Slot.at('#cpv-variant-slot')
	});


	Dashboard.visualize({
		 count : average,
		metric : ClicksPerVisit.on('control'),
		  slot : Slot.at('#cpv-control-slot')
	});

	/*
	Dashboard.visualize({
		metric : TotalSubscriptions.on('variant'),
		  slot : Slot.at('#ts-variant-slot')
	});

	Dashboard.visualize({
		metric : TotalSubscriptions.on('control'),
		  slot : Slot.at('#ts-variant-slot')
	});
	*/
}

/*------------------------------------------------------------------------*\
 DASHBOARD
\*------------------------------------------------------------------------*/

class Dashboard {

	static visualize({ count=na, metric, slot}) {
	    slot.prepare();

		metric.fetch()
			.then(count)
			.then(renderResultIntoSlot);

		function renderResultIntoSlot(result) {
			slot.render(result)
		}

		// use when not applicable
		function na(data) {
			return data;
		}
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

/*------------------------------------------------------------------------*\
  METRICS
\*------------------------------------------------------------------------*/

class PageViewsPerSession {

	static on(group) {
	    return new PageViewsPerSession(group);
	}

	constructor(group) {
	    this.group = group;
	}

	fetch() {
		return promise()
			.then(this.prepQuery.bind(this))
			.then(this.submitQueryToKeen.bind(this));
	}

	prepQuery() {
		const self = this;
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

	submitQueryToKeen(query) {
		return new Promise(resolve => {
			keen.run([query], (err, results) => {
				resolve(results.result);
			});
		})
	}
}

class ClicksPerVisit {

	static on(group) {
		return new ClicksPerVisit(group);
	}

	constructor(group) {
		this.group = group;
	}

	fetch() {
		return promise()
			.then(this.prepQuery.bind(this))
			.then(this.submitQueryToKeen.bind(this));
	}

	prepQuery() {
		const self = this;
		return new Keen.Query('count', Object.assign({
			eventCollection: 'cta',
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

	submitQueryToKeen(query) {
		return new Promise(resolve => {
			keen.run([query], (err, results) => {
				resolve(results.result);
			});
		})
	}
}

class TotalSubscriptions {

	constructor(group) {
		this.group = group;
	}

	fetch() {
		// TODO: Implement
	}
}

/*------------------------------------------------------------------------*\
  METRICS
\*------------------------------------------------------------------------*/

function average(items) {
	return sum(items) / items.length;
}

function sum(items) {
	let total = 0;

	for(const item of items) {
		total = total + item.result;
	}

	return total;
}

function promise() {
	return Promise.resolve();
}