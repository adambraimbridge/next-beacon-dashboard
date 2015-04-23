module.exports = {
	galleryInteraction: [
		{
			description: 'View a page with a gallery',
			query: {
				event_collection: "dwell",
				actor_property :"user.erights",
				filters: [{
					property_name: "page.capi.hasGallery",
					operator: "eq",
					property_value: true
				},
				{
					property_name: "keen.timestamp",
					operator: "gt",
					property_value: "2015-04-21T11:48:16.643",
					coercion_type: "Datetime"
				}]
			}
		},
		{
			description: 'View at least 25% of the gallery',
			query: {
				event_collection: "gallery",
				actor_property: "user.erights",
				filters: [{
					property_name: "meta.percentageThrough",
					operator: "gte",
					property_value: 25
				}]
			}
		},
		{
			description: 'View at least 50% of the gallery',
			query: {
				event_collection: "gallery",
				actor_property: "user.erights",
				filters: [{
					property_name: "meta.percentageThrough",
					operator: "gte",
					property_value: 50
				}]
			}
		},
		{
			description: 'View at least 75% of the gallery',
			query: {
				event_collection: "gallery",
				actor_property: "user.erights",
				filters: [{
					property_name: "meta.percentageThrough",
					operator: "gte",
					property_value: 75
				}]
			}
		},
		{
			description: 'View all the gallery',
			query: {
				event_collection: "gallery",
				actor_property: "user.erights",
				filters: [{
					property_name: "meta.percentageThrough",
					operator: "eq",
					property_value: 100
				}]
			}
		}
	],
	commentsComponent: [
		{
			description: 'Unique user',
			query: {
				event_collection: "dwell",
				actor_property :"user.erights"
			}
		},
		{
			description: 'Posted a comment',
			query: {
				event_collection: "comment",
				actor_property: "user.erights",
				optional: true,
				filters: [{
					property_name: "meta.interaction",
					operator: "eq",
					property_value: 'posted'
				}]
			}
		},
		{
			description: 'Liked a comment',
			query: {
				event_collection: "comment",
				actor_property: "user.erights",
				optional: true,
				filters: [{
					property_name: "meta.interaction",
					operator: "eq",
					property_value: 'liked'
				}]
			}
		},
		{
			description: 'Shared a comment',
			query: {
				event_collection: "comment",
				actor_property: "user.erights",
				optional: true,
				filters: [{
					property_name: "meta.interaction",
					operator: "eq",
					property_value: 'shared'
				}]
			}
		}
	]
};
