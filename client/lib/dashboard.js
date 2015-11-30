/* global Keen */

import keen from './wrapped-keen';

export class Dashboard {

	slot = undefined;

	query = {
		analysisType: '',
		eventCollection: '',
		filters: [],
		groupBy: [],
		timeframe: undefined,
		timezone: 'UTC'
	};

	performQuery(query) {
		return new Promise(resolve => {
			let q = new Keen.Query(query.analysisType, query);
			keen.run([q], (err, results) => {
				resolve(results.result);
			});
		});
	};

	calculateValueToBeRendered(data) {
		return data;
	}

	static visualize(...mods) {

		let dashboard = new Dashboard();

		/* -------------------------------------- */

		return promise()
			.then(applyModifiersToState)
			.then(showLoadingIndicatorOnSlot)
			.then(queryAnalyticsPlatformForData)
			.then(calculateValueToBeRendered)
			.then(renderFinalValueIntoSlot);

		/* -------------------------------------- */

		function applyModifiersToState() {
			for(const modify of mods) {
				modify(dashboard);
			}
		}

		function showLoadingIndicatorOnSlot() {
			dashboard.slot.prepare();
		}

		function queryAnalyticsPlatformForData() {
			return dashboard.performQuery(dashboard.query);
		}

		function calculateValueToBeRendered(data) {
			return dashboard.calculateValueToBeRendered(data)
		}

		function renderFinalValueIntoSlot(result) {
			dashboard.slot.render(result);
		}

		function promise() {
			return Promise.resolve();
		}
	}

	static average(items) {
		return this.sum(items) / items.length;
	}

	static sum(items) {
		let total = 0;

		for(const item of items) {
			total = total + item.result;
		}

		return total;
	}
}

export class Slot {

	constructor(selector) {
		let element = document.querySelector(selector);
		let attrs = element.dataset;

		this.instance = new Keen.Dataviz().el(element).title(attrs.vizTitle);

		if(attrs.vizColors) {
			this.instance.colors(attrs.vizColors.split(','))
		}
	}

	prepare() {
		this.instance.prepare();
	}
	render(data) {
		this.instance.data({ result: data }).render();
	}
}

export class DashboardMods {
	static counted(dashboard) {
		dashboard.query.analysisType = 'count';
	}

	static averaged(dashboard) {
		dashboard.query.analysisType = 'count';
		dashboard.calculateValueToBeRendered = function(items) {
			return Dashboard.average(items)
		};
	}

	static forAB({test, segment}) {
		return (dashboard) => {
			dashboard.query.filters.push({
				operator: 'eq',
				property_name: `ab.${test}`,
				property_value: segment
			});
		}
	}

	static pageViews(dashboard) {
		dashboard.query.eventCollection = 'dwell';
	}

	static clicks(dashboard) {
		dashboard.query.eventCollection = 'cta';
	}

	static bySession(dashboard) {
		dashboard.query.groupBy.push('ingest.device.spoor_session');
	}

	static forArticlePage(dashboard) {
		dashboard.query.filters.push({
			operator: 'contains',
			property_name: 'page.location.href',
			property_value: 'next.ft.com/content/'
		});
	}

	static forRelativeTimeframe(timeframe) {
	    return (dashboard) => {
			dashboard.query.timeframe = timeframe;
		}
	}

	static forAbsoluteTimeframe({start, end}) {
	    return (dashboard) => {
			dashboard.query.timeframe = {
				start,
				end
			};
		};
	}

	static inViewSlot(selector) {
		return (dashboard) => {
			dashboard.slot = new Slot(selector);
		}
	}
}