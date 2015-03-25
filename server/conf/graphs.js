module.exports = [{
	"... daily uniques today": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users on next (today)",
			"timeframe": "today",
			"interval": "hourly",
			"explain": "xxx"
		}
	},
	"... daily uniques": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users on next (14 days)",
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
			"title": "Unique users by page type (14 days)"
		}
	},
	"... by country": {	// FIXME - top 20?
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users by country (14 days)",
			"group_by": "user.geo.country_name"
		}
	},
	"... by continent": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users by continent (14 days)",
			"group_by": "user.geo.continent"
		}
	},
	"... by web browser": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"title": "Unique users by web browser (14 days)",
			"group_by": "user.browser.family"
		}
	},
	"... by operating system": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "user.os.family",
			"title": "Unique users by operating system family (14 days)"
		}
	},
	"... by device size": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "user.deviceType",
			"title": "Unique users by device size (14 days)"
		}
	},
	"... by referring site": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "page.referrer.hostname",
			"title": "Unique users by referrer (14 days)"
		}
	},
	"... by content genre": {
		pathname: "graph",
		query: {
			"event_collection": "dwell",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "page.capi.genre",
			"title": "Unique users by content genre (14 days)"
		}
	},
}];
