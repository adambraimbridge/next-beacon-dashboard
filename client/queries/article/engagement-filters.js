"use strict";

module.exports = {
	articleHeaderFilters: [
		{"operator":"contains",
		"property_name":"meta.domPath",
		"property_value":"article | header | "}
	],
	moreOnFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value": [
			"more-on | article-card | headline",
			"more-on | follow",
			"more-on | more-related-topics | topic-link",
			"more-on | related-organisations | topic-link",
			"more-on | related-people | topic-link",
			"more-on | related-regions | topic-link",
			"more-on | topic-link"
			]
		}
	],
	relatedStoriesFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"article | more-on-inline | articles | title", // can remove after Nov 7 2015
			"story-package | articles | title", // can remove after Nov 7 2015
			"article | more-on-inline | articles | article-card | headline",
			"article | more-on-inline | articles | image",
			"story-package | articles | article-card | headline",
			"story-package | articles | image"
			]
		}
	],
	promoboxFilters: [
		{"operator":"contains",
		"property_name":"meta.domPath",
		"property_value":"article | promobox | "}
	],
	linksFilters: [
		{"operator":"eq",
		"property_name":"meta.domPath",
		"property_value":"article | link"}
	],
	tocFilters: [
		{"operator":"eq",
		"property_name":"meta.domPath",
		"property_value":"article | table-of-contents | toc"}
	],
	articleLinksFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"article | link",
			"article | promobox | link",
			"article | more-on-inline | articles | title", // can remove after Nov 7 2015
			"story-package | articles | title", // can remove after Nov 7 2015
			"article | more-on-inline | articles | article-card | headline",
			"article | more-on-inline | articles | image",
			"story-package | articles | article-card | headline",
			"story-package | articles | image",
			"more-on | article-card | headline",
			"myft-tray | myft-feed | article-card | headline"
		]}
	],
	topicLinksFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"article | header | section-link",
			"article | header | author",
			"article | header | tags | tag",
			"more-on | topic-link",
			"myft-tray | topic-link"
		]}
	],
	shareLinksFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"share | facebook",
			"share | linkedin",
			"share | twitter",
			"share | whatsapp"
		]}
	]
};
