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
	}
}, {
	"Navigation menu": {
		pathname: 'tables',
		query: {
			timeframe: 'this_7_days',
			title: 'Navigation menu popularity',
			domPathContains: 'o-header | nav'
		}
	}
}];
