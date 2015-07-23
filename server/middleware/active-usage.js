
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
//
// [image_src]
// 	- Use the origami image service for caching/optimisation,
// 	  i.e. https://next-geebee.ft.com/image/v1/images/raw/{{your_image_src}}?source=beacon.ft.com
// 	- You can use this image library for convenience:
// 	  https://github.com/Financial-Times/next-beacon-dashboard/issues/152


// Add to these features if you want them to appear in the navigation.
// If you add it and it doesn't appear in the navigation, then
// the feature's probably missing from the feature-flag-api, or switched off.
var features = [{
		flagName:'articleComments',
		cta:'view-comments',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825010/4db920f8-3073-11e5-97ab-d2d53c911b43.png?source=beacon.ft.com'
	},
	{
		flagName:'articleRelatedContent',
		cta:'more-on',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825389/aa081d0c-3076-11e5-8953-1ef09a14134b.png?source=beacon.ft.com'
	},
	{
		flagName:'articleTOC',
		cta:'toc',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825470/4a7e94fa-3077-11e5-8d8b-28269edd3b33.png?source=beacon.ft.com'
	},
	{
		flagName:'dynamicTertiaryNav',
		cta:'dynamic-tags'
	},
	{
		flagName:'capiV2LinkedDataOrganisationHeader',
		cta:'organisation-summary',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825320/2eb08dec-3076-11e5-9473-5a4946dbb848.png?source=beacon.ft.com'
	},
	{
		flagName:'follow',
		cta:'follow',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825048/a8bb1740-3073-11e5-8749-b7272cd38b94.png?source=beacon.ft.com'
	},
	{
		flagName:'globalNavigation',
		cta:'primary-nav',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825055/befdd90c-3073-11e5-83d8-391e4416afd5.png?source=beacon.ft.com'
	},
	{
		flagName:'homePageLoadMore',
		cta:'toggle-more-stories'
	},
	{
		flagName:'homePageMyFTPanel',
		cta:'myft-panel',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825354/5e72b762-3076-11e5-88de-edfa88f1a623.png?source=beacon.ft.com'
	},
	{
		flagName:'homePageMyPageFeed',
		cta:'myft-panel | myft-topic | follow'
	},
	{
		flagName:'marketDataAPI',
		cta:'markets-link',
	},
	{
		flagName:'myPageTopicSuggestions',
		cta:'my-page-onboarding',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825365/8d680068-3076-11e5-93d2-f99089e3bec3.png?source=beacon.ft.com'
	},
	{
		flagName:'pagination',
		cta:'next-page',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825089/2eb03542-3074-11e5-848a-1317d1459b58.png?source=beacon.ft.com'
	},
	{
		flagName:'saveForLater',
		cta:'save-for-later',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825077/1858b4f4-3074-11e5-8e2f-da97856d41cf.png?source=beacon.ft.com'
	},
	{
		flagName:'search',
		cta:'search-form',
		image_src:'https://next-geebee.ft.com/image/v1/images/raw/https://cloud.githubusercontent.com/assets/224547/8825256/99ef5c24-3075-11e5-8409-aea0a426ae9a.png?source=beacon.ft.com'
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
