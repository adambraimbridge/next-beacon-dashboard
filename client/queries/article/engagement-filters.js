"use strict";

module.exports = {
	allArticlesBaseFilters: [],
	articleHeaderActionFilters: [
		{"operator":"contains",
		"property_name":"meta.domPath",
		"property_value":"article | header | "}
	],
	moreOnActionFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value": [
			"more-on | article-card | headline", // can remove after Dec 7 2015
			"more-on | headline",
			"more-on | image",
			"more-on | follow",
			"more-on | more-related-topics | topic-link", // can remove after Dec 7 2015
			"more-on | related-organisations | topic-link", // can remove after Dec 7 2015
			"more-on | related-people | topic-link", // can remove after Dec 7 2015
			"more-on | related-regions | topic-link", // can remove after Dec 7 2015
			"more-on | tag",
			"more-on | topic-link",
			"mentions | tag",
			"mentions | follow"
			]
		}
	],
	relatedStoriesActionFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"article | more-on-inline | articles | title", // can remove after Nov 7 2015
			"story-package | articles | title", // can remove after Nov 7 2015
			"article | more-on-inline | articles | article-card | headline", // can remove after Dec 7 2015
			"article | more-on-inline | articles | image", // can remove after Dec 7 2015
			"article | more-on-inline | headline",
			"article | more-on-inline | image",
			"article | more-on-inline | tag",
			"story-package | articles | article-card | headline", // can remove after Dec 7 2015
			"story-package | articles | image", // can remove after Dec 7 2015
			"story-package | headline",
			"story-package | image",
			"story-package | tag"
			]
		}
	],
	relatedStoriesBaseFilters: [
		{"operator":"eq",
		"property_name":"content_v1.flags.hasStoryPackage",
		"property_value":true}
	],
	promoboxActionFilters: [
		{"operator":"contains",
		"property_name":"meta.domPath",
		"property_value":"article | promobox | "}
	],
	promoboxBaseFilters: [
		{"operator":"eq",
		"property_name":"content_v1.flags.hasPromoBox",
		"property_value":true}
	],
	linksActionFilters: [
		{"operator":"eq",
		"property_name":"meta.domPath",
		"property_value":"article | link"}
	],
	linksBaseFilters: [
		{"operator":"eq",
		"property_name":"content_v1.flags.hasLinksInBody",
		"property_value":true}
	],
	tocActionFilters: [
		{"operator":"eq",
		"property_name":"meta.domPath",
		"property_value":"article | table-of-contents | toc"}
	],
	tocBaseFilters: [
		{"operator":"eq",
		"property_name":"content_v1.flags.hasTableOfContents",
		"property_value":true}
	],
	articleLinksFilters: [
		{"operator":"in",
		"property_name":"meta.domPath",
		"property_value":[
			"article | link",
			"article | promobox | link",
			"article | more-on-inline | articles | title", // can remove after Nov 7 2015
			"story-package | articles | title", // can remove after Nov 7 2015
			"article | more-on-inline | articles | article-card | headline", // can remove after Dec 7 2015
			"article | more-on-inline | articles | image", // can remove after Dec 7 2015
			"story-package | articles | article-card | headline", // can remove after Dec 7 2015
			"story-package | articles | image", // can remove after Dec 7 2015
			"more-on | article-card | headline", // can remove after Dec 7 2015
			"myft-tray | myft-feed | article-card | headline",
			"more-on | headline",
			"more-on | image",
			"article | more-on-inline | headline",
			"article | more-on-inline | image",
			"story-package | headline",
			"story-package | image"
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
			"myft-tray | topic-link",
			"more-on | tag",
			"mentions | tag",
			"article | more-on-inline | tag",
			"story-package | tag"
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
