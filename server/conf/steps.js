"use strict";

// Return the ISO string for relative dates
var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

// This is a base step object, for spawning steps.
var step = function(options) {
	return {
		eventCollection:options.eventCollection || "dwell",
		actor_property:"user.erights",
		timeframe:options.timeframe,
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}].concat(options.filters || [])
	};
};

var activeUserSteps = function() {
	return [{
		description: 'Users who visited next.ft in a one-week period, two weeks whence',
		query: step({
			timeframe: {
				start:daysFromNow(-14), //two weeks whence
				end:daysFromNow(-7) //one week whence
			}
		})
	},
	{
		description: 'Users who visited next.ft in the last 7 days',
		query: step({
			timeframe: {
				start:daysFromNow(-7), //one week whence
				end:daysFromNow() //now
			}
		})
	}];
};

// Export libraries of steps
module.exports = {
	galleryInteraction: [
		{
			description: 'View a page with a gallery',
			query: {
				event_collection: 'dwell',
				actor_property :'user.erights',
				filters: [{
					property_name: 'page.capi.hasGallery',
					operator: 'eq',
					property_value: true
				},
				{
					property_name: 'keen.timestamp',
					operator: 'gt',
					property_value: '2015-04-21T11:48:16.643',
					coercion_type: 'Datetime'
				}]
			}
		},
		{
			description: 'View at least 25% of the gallery',
			query: {
				event_collection: 'gallery',
				actor_property: 'user.erights',
				filters: [{
					property_name: 'meta.percentageThrough',
					operator: 'gte',
					property_value: 25
				}]
			}
		},
		{
			description: 'View at least 50% of the gallery',
			query: {
				event_collection: 'gallery',
				actor_property: 'user.erights',
				filters: [{
					property_name: 'meta.percentageThrough',
					operator: 'gte',
					property_value: 50
				}]
			}
		},
		{
			description: 'View at least 75% of the gallery',
			query: {
				event_collection: 'gallery',
				actor_property: 'user.erights',
				filters: [{
					property_name: 'meta.percentageThrough',
					operator: 'gte',
					property_value: 75
				}]
			}
		},
		{
			description: 'View all the gallery',
			query: {
				event_collection: 'gallery',
				actor_property: 'user.erights',
				filters: [{
					property_name: 'meta.percentageThrough',
					operator: 'eq',
					property_value: 100
				}]
			}
		}
	],
	commentsComponent: [
		{
			description: 'Unique user',
			query: {
				event_collection: 'dwell',
				actor_property :'user.erights'
			}
		},
		{
			description: 'Posted a comment',
			query: {
				event_collection: 'comment',
				actor_property: 'user.erights',
				optional: true,
				filters: [{
					property_name: 'meta.interaction',
					operator: 'eq',
					property_value: 'posted'
				}]
			}
		},
		{
			description: 'Liked a comment',
			query: {
				event_collection: 'comment',
				actor_property: 'user.erights',
				optional: true,
				filters: [{
					property_name: 'meta.interaction',
					operator: 'eq',
					property_value: 'liked'
				}]
			}
		},
		{
			description: 'Shared a comment',
			query: {
				event_collection: 'comment',
				actor_property: 'user.erights',
				optional: true,
				filters: [{
					property_name: 'meta.interaction',
					operator: 'eq',
					property_value: 'shared'
				}]
			}
		}
	],
	galleryComponent: [
		{
			description: 'Unique user',
			query: {
				event_collection: 'dwell',
				actor_property :'user.erights'
			}
		},
		{
			description: 'Seen a gallery',
			query: {
				event_collection: 'dwell',
				actor_property: 'user.erights',
				optional: true,
				filters: [{
					property_name: 'page.capi.hasGallery',
					operator: 'eq',
					property_value: true
				}]
			}
		},
		{
			description: 'Interacted with a gallery',
			query: {
				event_collection: 'gallery',
				actor_property: 'user.erights',
				optional: true
			}
		}
	],
	mypageFollowing: [
		{
			description: 'All users',
			query: {
				actor_property: 'user.erights',
				timeframe: 'this_14_days',
				event_collection: 'cta'
			}
		}, {
			description: 'Are following at least one topic',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'gte',
						property_name: 'user.myft.topicsFollowed',
						property_value: 1
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'dwell'
			}
		}, {
			description: 'Visited mypage/following',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'contains',
						property_name: 'page.location.pathname',
						property_value: 'mypage/following'
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'dwell'
			}
		}, {
			description: 'Arrived at article from mypage',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'contains',
						property_name: 'page.referrer.pathname',
						property_value: 'mypage/following'
					},
					{
						operator: 'eq',
						property_name: 'page.location.type',
						property_value: 'article'
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'dwell'
			}
		}
	],
	myfeedFollowing: [
		{
			description: 'All users',
			query: {
				actor_property: 'user.erights',
				timeframe: 'this_14_days',
				event_collection: 'cta'
			}
		}, {
			description: 'Are following at least one topic',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'gte',
						property_name: 'user.myft.topicsFollowed',
						property_value: 1
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'dwell'
			}
		}, {
			description: 'Referred to article from mypage feed',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'contains',
						property_name: 'meta.domPath',
						property_value: 'my-page-feed | headline'
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'cta'
			}
		}
	],
	myFTFNotifications: [
		{
			description: 'All users',
			query: {
				actor_property: 'user.erights',
				timeframe: 'this_14_days',
				event_collection: 'cta'
			}
		}, {
			description: 'Are following at least one topic',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'gte',
						property_name: 'user.myft.topicsFollowed',
						property_value: 1
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'dwell'
			}
		}, {
			description: 'Referred to article from any notification generated by myFT',
			query: {
				actor_property: 'user.erights',
				filters: [
					{
						operator: 'contains',
						property_name: 'page.location.hash',
						property_value: 'myft:notification'
					}
				],
				timeframe: 'this_14_days',
				event_collection: 'cta'
			}
		}
	],
	globalNavigation: activeUserSteps().concat([
		{
			description: 'Users who clicked any primary-nav CTA in the past two weeks',
			query: step({
				eventCollection: "cta",
				timeframe: {
					start:daysFromNow(-14), //two weeks whence
					end:daysFromNow() //now
				},
				filters: [{
					property_name:"meta.domPath",
					operator:"contains",
					property_value:"primary-nav"
				}]
			})
		}
	]),
	homePageLoadMore: activeUserSteps().concat([
		{
			description: 'Users who clicked the toggle-more-stories CTA in the past two weeks',
			query: step({
				eventCollection: "cta",
				timeframe: {
					start:daysFromNow(-14), //two weeks whence
					end:daysFromNow() //now
				},
				filters: [{
					property_name:"meta.domPath",
					operator:"contains",
					property_value:"toggle-more-stories"
				}]
			})
		}
	]),
	marketDataAPI: activeUserSteps().concat([
		{
			description: 'Users who clicked the markets-link CTA in the past two weeks',
			query: step({
				eventCollection: "cta",
				timeframe: {
					start:daysFromNow(-14), //two weeks whence
					end:daysFromNow() //now
				},
				filters: [{
					property_name:"meta.domPath",
					operator:"contains",
					property_value:"markets-link"
				}]
			})
		}
	])
};
