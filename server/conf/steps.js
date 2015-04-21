module.exports = {
	galleryInteraction: [
		{
	      event_collection: "dwell",
	      actor_property :"user.erights",
	      filters: [
	         {
	            property_name: "page.capi.hasGallery",
	            operator: "eq",
	            property_value: true
	         }
	      ]
	   },
	   {
	      event_collection: "gallery",
	      actor_property: "user.erights",
	      filters: [
	         {
	            property_name: "meta.percentageThrough",
	            operator: "gte",
	            property_value: 25
	         }
	      ]
	   },
	   {
	      event_collection: "gallery",
	      actor_property: "user.erights",
	      filters: [
	         {
	            property_name: "meta.percentageThrough",
	            operator: "gte",
	            property_value: 50
	         }
	      ]
	   },
	   {
	      event_collection: "gallery",
	      actor_property: "user.erights",
	      filters: [
	         {
	            property_name: "meta.percentageThrough",
	            operator: "eq",
	            property_value: 100
	         }
	      ]
	   }
	]
};
