/* global $, cutsTheMustard */

"use strict";

var oTracking = require('o-tracking');

// O-tracking is only desired for the production environment.
if (cutsTheMustard && $('html').data('next-is-production') !== undefined) {

	oTracking.init({
		server: 'https://spoor-api.ft.com/ingest',
		context: {
			product: 'next'
		},
		user: {}
	});

	oTracking.event({
		detail: {
			category: 'beacon-dashboard',
			action: 'beacon-dashboard'
		}
	});
}
