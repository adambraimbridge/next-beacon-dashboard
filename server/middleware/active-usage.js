
'use strict';

var _ = require('lodash');

var FEATURE_FLAG_NOT_FOUND = "404";

// // The pattern here is { featureName:[feature name], cta:[cta] }
// [feature name]
// 	— comes from https://github.com/Financial-Times/next-feature-flags-api/blob/master/models/flags.js
//  — which is also exposed here: https://next.ft.com/__toggler
//
// [cta]
// 	— is the data-trackable attribute that the given feature exposes
// 	— if a feature doesn't expose any CTA elements, it's not suitable for this list.

var features = [{
		flagName:'articleComments',
		cta:'view-comments'
	},
	{
		flagName:'articleRelatedContent',
		cta:'more-on'
	},
	{
		flagName:'articleTOC',
		cta:'toc'
	},
	{
		flagName:'dynamicTertiaryNav',
		cta:'dynamic-tags'
	},
	{
		flagName:'capiV2LinkedDataOrganisationHeader',
		cta:'organisation-summary'
	},
	{
		flagName:'follow',
		cta:'follow'
	},
	{
		flagName:'globalNavigation',
		cta:'primary-nav'
	},
	{
		flagName:'homePageLoadMore',
		cta:'toggle-more-stories'
	},
	{
		flagName:'homePageMyFTPanel',
		cta:'myft-panel'
	},
	{
		flagName:'homePageMyPageFeed',
		cta:'myft-panel | myft-topic | follow'
	},
	{
		flagName:'marketDataAPI',
		cta:'markets-link'
	},
	{
		flagName:'myPageTopicSuggestions',
		cta:'my-page-onboarding'
	},
	{
		flagName:'pagination',
		cta:'next-page'
	},
	{
		flagName:'saveForLater',
		cta:'save-for-later'
	},
	{
		flagName:'search',
		cta:'search-form'
	},
	{
		flagName:'myFTReadingListOnArticle',
		cta:'myft-reading-list'
	}
];

var activeUsage = function(req, res, next) {

	// Populate the hard-coded feature list with data from the feature-flags API
	var featureNavigationItems = [];
	features.forEach(function(feature){
		var match = _.find(res.locals.flagsArray, function(flag) {
			return flag.name === feature.flagName;
		});
		if (match) {
			feature.state = match.state;
			feature.expiry = match.expiry;

			if (feature.state === true) {
				featureNavigationItems.push(feature.flagName);
			}
		}
		else {
			feature.state = FEATURE_FLAG_NOT_FOUND;
		}
		return feature;
	});
	res.locals.activeUsageFeatures = features;

	// Make active-usage features available for the global navigation (beacon.html)
	// (sorted alphabetically and filtered for "state=true" feature flags)
	res.locals.featureNavigationItems = featureNavigationItems.sort();

	next();
};

module.exports = activeUsage;
