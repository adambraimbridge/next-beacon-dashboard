module.exports = [{
	"... daily uniques": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users on next (7 days)",
			"explain": "xxx"
		}
	},
	"... by page type": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "page.location.type",
			"title": "Unique users by page type (7 days)"
		}
	},
	"... by country": {	// FIXME - top 20?
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users by country (7 days)",
			"group_by": "user.geo.country_name"
		}
	},
	"... by continent": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users by continent (7 days)",
			"group_by": "user.geo.continent"
		}
	},
	"... by web browser": {
		pathname: "graph",
		query: {
			"event_collection": "cta",
			"metric": "count",
			"domPathContains": "article-card",
			"title": "Interactions with article cards"
		},
	},
	"... by operating system": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "user.os.family",
			"title": "Unique users by operating system family"
		}
	},
	"... by device size": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "user.deviceType",
			"title": "Unique users by device size"
		}
	},
	"... by referring site": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "page.referrer.hostname",
			"title": "Unique users by referrer"
		}
	}
}];
