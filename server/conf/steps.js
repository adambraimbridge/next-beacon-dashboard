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
	]
};
