module.exports = {
	isStaff: {
		property_name: "user.isStaff",
		operator: "eq"
	},
	uuid: {
		"property_name": "page.capi.id",
		"operator": "eq"
	},
	pageType: {
		"property_name": "page.location.type",
		"operator": "eq"
	},
	erights: {
		"property_name": "user.erights",
		"operator": "eq"
	},
	flags: {
		"property_name": "user.flags",
		"operator": "eq",
	},
	domPath: {
		"property_name": "meta.domPath",
		"operator": "eq",
	},
	domPathContains: {
		"property_name": "meta.domPath",
		"operator": "contains",
	}
};