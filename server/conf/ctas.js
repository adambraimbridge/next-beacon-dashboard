module.exports = [{
	"Article cards (%)": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"domPathContains": "article-card",
			"group_by": "meta.domPath",
			"title": "Popularity of article components (%)",
			"stacked_area": true
		},
	},
	"Article cards": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"domPathContains": "article-card",
			"group_by": "meta.domPath",
			"title": "Popularity of article components"
		},
	},
	"Galleries": {
		pathname: "flow",
		query: {
			metric: "funnel",
			title: "Interaction with galleries",
			steps: "galleryInteraction"
		},
	}
}, {
	"Navigation menu": {
		pathname: 'table',
		query: {
			timeframe: 'this_7_days',
			title: 'Navigation menu popularity',
			domPathStartsWith: 'header'
		}
	}
}, {
	"Search terms - last 7 days": {
		pathname: 'search',
		query: {
			timeframe: 'this_7_days',
			title: 'Search terms (last 7 days)'
		}
	},
	"Search terms - last 4 weeks": {
		pathname: 'search',
		query: {
			timeframe: 'this_28_days',
			title: 'Search terms - last 4 weeks'
		}
	}
}];
