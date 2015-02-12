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
	},
	wordCount: {
		property_name: "page.article.wordCount",
		operator: "gt",
		title: "Minimum word count",
		values: {
			50: "50",
			100: "100",
			200: "200",
			500: "500",
			1000: "1000",
			1500: "1500",
			2000: "2000",
			2500: "2500",
			3000: "3000"
		}
	},
	inTheLast: {
		property_name: 'keen.timestamp',
		operator: 'gte',
		hidden: true
	}
};