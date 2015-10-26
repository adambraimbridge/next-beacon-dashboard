/* global $, cutsTheMustard */

"use strict";

var oTracking = require('o-tracking');

// O-tracking is only desired for the production environment.
if (cutsTheMustard && $('html').data('next-is-production') !== undefined) {

	oTracking.init({
		server: 'https://spoor-api.ft.com/ingest',
		context: {
			product: 'beacon-dashboard'
		},
		user: {}
	});

	oTracking.page({
		content: {
			asset_type: 'page'
		}
	});
}
