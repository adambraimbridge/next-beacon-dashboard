module.exports = [{
	"Opt in vs out (today)": {
		pathname: "opt-in-out",
		query: {
			"event_collection": "optin",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "meta.type",
			"title": "Opt in vs out (today, non-staff)",
			"timeframe": "today",
			"interval": "monthly",
			"isUnknown": "user.isStaff"
		}
	},
	"Opt in vs out (past week)": {
		pathname: "opt-in-out",
		query: {
			"event_collection": "optin",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "meta.type",
			"title": "Opt in vs out (past week, non-staff)",
			"timeframe": "this_7_days",
			"interval": "monthly",
			"isUnknown": "user.isStaff"
		}
	},
	"Opt outs by reason": {
		pathname: "graph",
		query: {
			"event_collection": "optin",
			"metric": "count_unique",
			"target_property": "user.erights",
			"group_by": "meta.reason",
			"title": "Opt outs by reason (past week)",
			"timeframe": "this_7_days",
			"interval": "daily",
			"exists": "meta.reason",
			"notUnknown": "meta.reason"
		}
	}
}];
