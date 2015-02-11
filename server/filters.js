module.exports = {
	isStaff: {
		property_name: "user.isStaff",
		operator: "eq",
		title: 'Staff',
		values: {
			false: 'Included',
			true: 'Excluded'
		}
	},
	uuid: {
		"property_name": "page.capi.id",
		"operator": "eq",
		hidden: true
	},
	pageType: {
		"property_name": "page.location.type",
		"operator": "eq",
		title: 'Page type',
		values: {
			frontpage: 'Frontpage',
			article: 'Article',
			stream: 'Stream',
			search: 'Search',
			my: 'My',
			group: 'Group'
		}
	},
	erights: {
		"property_name": "user.erights",
		"operator": "eq",
		hidden: true
	},
	flags: {
		"property_name": "user.flags",
		"operator": "eq",
		hidden: true
	},
	domPath: {
		"property_name": "meta.domPath",
		"operator": "eq",
		hidden: true
	},
	domPathContains: {
		"property_name": "meta.domPath",
		"operator": "contains",
		hidden: true
	}
};