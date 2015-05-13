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
	"Before you go links (%)": {
		pathname: "graph",
		query: {
			event_collection: "cta",
			metric: "count",
			domPathContains: "looking-for",
			group_by: "meta.domPath",
			title: "Popularity of “before you opt out” links (%)",
			stacked_area: true
		}
	},
	"Before you go links": {
		pathname: "graph",
		query: {
			event_collection: "cta",
			metric: "count",
			domPathContains: "looking-for",
			group_by: "meta.domPath",
			title: "Popularity of “before you opt out” links"
		}
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
