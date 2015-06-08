var queryString = require('query-string');
var queryParameters = queryString.parse(location.search);

// Return the ISO string for relative dates
var daysFromNow = function (offset) {
	offset = offset || 0;
	var dateObject = new Date();
	dateObject.setDate(dateObject.getDate() + offset);
	return dateObject.toISOString();
};

// This is a base step object, for spawning steps.
var step = function(options) {
	return {
		eventCollection:options.eventCollection || "dwell",
		actor_property:"user.erights",
		timeframe:options.timeframe || {
			start:daysFromNow(-14), //two weeks whence
			end:daysFromNow() //now
		},
		filters:[{
			property_name:"user.isStaff",
			operator:"eq",
			property_value:false
		}].concat(options.filters || [])
	};
};

var dashboards = {};
dashboards['Galleries'] = {
	'title' : 'Engagement with galleries',
	'labels' : [
		'Visited next.ft.com',
		'Visited a page with a gallery',
		'Viewed at least 25%',
		'Viewed at least 50%',
		'Viewed at least 75%',
		'Viewed all the gallery'
	],
	'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'page.capi.hasGallery',
				operator: 'eq',
				property_value: true
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 25
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 50
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 75
			}]
		}),
		step({
			eventCollection: 'gallery',
			filters: [{
				property_name: 'meta.percentageThrough',
				operator: 'gte',
				property_value: 100
			}]
		})
	]
};

dashboards['MyFT'] = {
	'title' : 'Engagement with myFT',
	'labels' : [
		'Visited next.ft.com',
		'Are following at least one topic',
		'Visited their "myFT" page ...',
		'... then went straight to an article'
	],
	'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				property_name: 'page.location.pathname',
				operator: 'contains',
				property_value: 'mypage/following'
			}]
		}),
		step({
			filters: [{
				property_name: 'page.referrer.pathname',
				operator: 'contains',
				property_value: 'mypage/following'
			},
			{
				property_name: 'page.location.type',
				operator: 'eq',
				property_value: 'article'
			}]
		})
	]
};

dashboards['MyPageFeed'] = {
	'title' : 'Engagement with my page feed',
	'labels' : [
		'Visited next.ft.com',
		'Are following at least one topic',
		'Referred to an article from mypage feed'
	],
	'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				property_name: 'meta.domPath',
				operator: 'contains',
				property_value: 'my-page-feed | headline'
			}]
		})
	]
};

dashboards['AllMyFTNotifications'] = {
	'title' : 'Engagement with any myFT notification',
	'labels' : [
		'Visited next.ft.com',
		'Are following at least one topic',
		'Viewed an article via myft:notification'
	],
	'steps':[
		step({}),
		step({
			filters: [{
				property_name: 'user.myft.topicsFollowed',
				operator: 'gte',
				property_value: 1
			}]
		}),
		step({
			filters: [{
				property_name: 'page.location.hash',
				operator: 'contains',
				property_value: 'myft:notification'
			}]
		})
	]
};

var query = new Keen.Query("funnel", {
	steps:dashboards[queryParameters.dashboard].steps
});

var render = function (el, results, opts, client) {
	$('<h1>').text(dashboards[queryParameters.dashboard].title).appendTo(el);

	var chartEl = $('<div>').attr('id', 'metric').appendTo(el);
	client.draw(query, document.getElementById('metric'), {
		title: 'Count of unique users for the past 14 days',
		labels: dashboards[queryParameters.dashboard].labels,
		chartOptions: {
			chartArea: { left: "30%" },
			legend: { position: "none" }
		}
	});
}

module.exports = {
	query:query,
	render:render
};