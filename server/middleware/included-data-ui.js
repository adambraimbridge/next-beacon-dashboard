/*jshint node:true*/
'use strict';

var includedDataUi = function(req, res, next) {

	req.included_data_ui = {
		include_staff: req.param('include_staff') || true,
		include_identified_users: req.param('include_identified_users') || true,
		include_unidentified_visitors: req.param('include_unidentified_visitors') || false
	};

	next();
}

module.exports = includedDataUi;
