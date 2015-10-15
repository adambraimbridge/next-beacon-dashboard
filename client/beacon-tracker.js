/* global $, article_id, original_url */

"use strict";

/*
TODO — update to the new spoor api
*/

// Beacon tracking is only desired for the production environment.
if ($('html').data('next-is-production') !== undefined) {
	var src = '//next-beacon.ft.com/px.gif/beacon-dashboard';
	var data = {
		"user":{},
		"page":{
			"article_id": article_id,
			"original_url": original_url
		}
	};

	$('<img>').attr('src', src + '?data=' + encodeURIComponent(JSON.stringify(data)))
		.appendTo($('body'));
}
