/* global $, page_name */

"use strict";

document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));

// Update the navigation element for the current page as appropriate
$('.o-hierarchical-nav [data-nav-name="'+page_name+'"]').attr({
	'aria-selected':'true',
	'aria-expanded':'true'
});
