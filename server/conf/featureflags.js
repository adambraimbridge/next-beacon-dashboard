module.exports = [{
	"globalNavigation": {
		pathname: "featureflags",
		query: {
			title: "Feature: globalNavigation",
			metric: 'funnel',
			steps: 'globalNavigation'
		}
	},
	"Feature B": {
		pathname: "featureflags",
		query: {
			title: "In the last 24 hours...",
			metric: 'funnel',
			timeframe: 'this_24_hours',
			steps: 'galleryComponent'
		}
	}
}];
