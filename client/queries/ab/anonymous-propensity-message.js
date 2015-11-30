import {Dashboard, DashboardMods as d} from '../../lib/dashboard';

import queryString from 'querystring';

const queryParameters = queryString.parse(location.search);

export function render() {

	Dashboard.visualize(
		d.averaged,
		d.pageViews,
		m.onABVariantSegment,
		d.bySession,
		m.forLengthOfABTest,
		d.inViewSlot('#apv-variant-slot')
	);
	
	Dashboard.visualize(
		d.averaged,
		d.pageViews,
		m.onABControlSegment,
		d.bySession,
		m.forLengthOfABTest,
		d.inViewSlot('#apv-control-slot')
	);

	Dashboard.visualize(
		d.averaged,
		d.clicks,
		m.onABVariantSegment,
		d.bySession,
		d.forArticlePage,
		m.forLengthOfABTest,
		d.inViewSlot('#cpv-variant-slot')
	);
	
	Dashboard.visualize(
		d.averaged,
		d.clicks,
		m.onABControlSegment,
		d.bySession,
		d.forArticlePage,
		m.forLengthOfABTest,
		d.inViewSlot('#cpv-control-slot')
	);
}

/* ----------------------------------------------------------------- *\
   Local Mods
/* ----------------------------------------------------------------- */

class m {

	static onABVariantSegment(dashboard) {
		d.forAB({test:'propensityMessaging', segment:'variant'})(dashboard);
	}

	static onABControlSegment(dashboard) {
		d.forAB({test:'propensityMessaging', segment:'control'})(dashboard);
	}

	static forLengthOfABTest(dashboard) {
		const defaultTimeframe = { start: '2015-11-14T00:00:00.000+00:00', end: '2015-11-19T00:00:00.000+00:00'};

		queryParameters.timeframe 
			? d.forRelativeTimeframe(queryParameters.timeframe)(dashboard)
			: d.forAbsoluteTimeframe(defaultTimeframe)(dashboard);
	}
}