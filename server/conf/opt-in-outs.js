module.exports = [{
	"Opt in vs out": {
		pathname: "opt-in-out",
		query: {
			"event_collection": "optin",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "meta.type",
			"title": "Opt in vs out",
			"timeframe": "this_7_days",
			"interval": "monthly",
			"exists": "meta.type"
		}
	},
	"Opt outs by reason": {
		pathname: "graph",
		query: {
			"event_collection": "optin",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "meta.reason",
			"title": "Opt outs by reason (over the past week)",
			"timeframe": "this_7_days",
			"interval": "daily",
			"exists": "meta.reason",
			"notUnknown": "meta.reason"
		}
	}
}];
