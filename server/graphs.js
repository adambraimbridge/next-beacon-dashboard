module.exports = [{
	"Unique users": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users on next"
		}
	},
	"Usage by page type": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "page.location.type",
			"title": "Unique users by page type"
		}
	},
	"Users by country": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Country",
			"group_by": "user.country"
		}
	},
	"Usage by web browser": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "user.browser.family",
			"title": "Web browsers"
		}
	},
}, {
	"Article cards": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"domPathContains": "article-card",
			"title": "Interactions with article cards"
		},
	},
	"Navigation menu": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"target_property": "user.erights",
			"domPathEquals": "o-header%20|%20menu-button",
			"title": "Interactions with the navigation menu"
		}
	},
	"Save for later": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count_unique",
			"target_property": "user.erights",
			"domPathContains": "save-for-later",
			"title": "Unique users using 'save for later'"
		}
	},
	"Search": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"target_property": "user.erights",
			"domPathEquals": "o-header%20|%20search-button",
			"title": "Interactions with the search button"
		}
	},
}, {
	"Addiction": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "time.day",
			"group_by": "user.erights",
			"title": "Next addiction",
			inTheLast: 'week',
			single: true,
			histogram: true,
			process_countAs: 'user.erights',
			window: 1
		}
	},
	"Wordcount scroll depth": {
		pathname: "graph",
		query: {
			event_collection: ['dwell', 'scrolldepth'],
			metric: ['count_unique', 'count_unique'],
			target_property: 'user.erights',
			group_by: 'page.article.wordCount',
			title: 'Dwell vs scrolldepth by article length',
			single: true,
			logX: true
		}
	},
	"Dwell vs scroll": {
		pathname: 'graph',
		query: {
			event_collection: ['dwell', 'scrolldepth'],
			metric: ['count_unique', 'count_unique'],
			target_property: 'user.erights',
			title: 'Dwell vs scrolldepth over time'
		}
	}
}, {
	"domInteractive vs loadEventEnd": {
		pathname: 'graph',
		query: {
			event_collection: ['timing', 'timing'],
			metric: ['average', 'average'],
			target_property: ['meta.timings.loadEventEnd', 'meta.timings.domInteractive'],
			title: 'domInteractive vs loadEventEnd'
		}
	},
	"domInteractive percentiles": {
		pathname: 'graph',
		query: {
			event_collection: ['timing', 'timing', 'timing', 'timing'],
			metric: ['percentile','percentile','percentile','percentile'],
			percentile: [99, 95, 75, 50, 25],
			target_property: 'meta.timings.domInteractive',
			title: 'domInteractive percentiles'
		}
	}
}];