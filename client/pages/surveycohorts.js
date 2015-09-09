/* global Keen, $, _, keen_project, keen_read_key */

'use strict';

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var daysAgo = function (n) {
	var d = new Date();
	d.setDate(d.getDate() - n);
	d.setUTCHours(0,0,0,0);
	return d.toISOString();
};

var surveyCohorts = [
	{
		label:'First-week Survey',
		weeksOfActiveUse: 1,
		description:'Sent after one week of use. User must have opted in exactly 7 days ago.'
	},
	{
		label:'Fourth-week Survey',
		weeksOfActiveUse: 4,
		description:'Sent after four weeks of use. User must have opted in exactly 28 days ago, and visited at least once per week over the past 28 days excluding the current day.'
	},
	{
		label:'Third-month Survey',
		weeksOfActiveUse: 12,
		description:'Sent after twelve weeks of use. User must have opted in exactly 84 days ago, and visited at least once per week over the past 84 days excluding the current day.'
	},
];

// Generate keen queries for survey cohorts.
// Note: The order in which the queries are added matters, because
// the keen response is expected to be in a specific order.
// (optinResponse + weekViewResponse, in pairs, for each surveyCorhort)
var queries = [];
surveyCohorts.forEach(function(n) {

	// Who opted in exactly `weeksOfActiveUse` ago?
	queries.push(new Keen.Query('count_unique', {
		timeframe: {
			start:daysAgo(n.weeksOfActiveUse*7),
			end:daysAgo((n.weeksOfActiveUse*7)-1),
		},
		event_collection: 'optin',
		target_property: 'user.uuid',
		group_by: 'user.uuid',
		filters:[{
			'property_name':'meta.reason',
			'operator':'exists',
			'property_value':false
		}],
		timezone: 'UTC',
		maxAge: 10800
	}));

	// Who's visited every week for the past `weeksOfActiveUse` weeks?
	queries.push(new Keen.Query('count_unique', {
		timeframe: {
			start:daysAgo(n.weeksOfActiveUse*7),
			end:daysAgo(0),
		},
		event_collection: 'dwell',
		target_property: 'time.week',
		group_by: 'user.uuid',
		timezone: 'UTC',
		maxAge: 10800
	}));
});

var getCandidates = function(cohort, optinResponse, weekViewResponse){
	console.log('optinResponse',optinResponse);
	surveyCohorts[cohort].candidates = _.chain(weekViewResponse.result)
		.map(function(row){
			if(row.result >= surveyCohorts[cohort].weeksOfActiveUse
				&& _.findIndex(optinResponse.result, {'user.uuid':row['user.uuid']}) >= 0){
				return row['user.uuid'];
			}
			return null;
		})
		.compact()
		.value();
}

var getDownloadLink = function(surveyCohort){
	var blob = new Blob([surveyCohort.candidates.join('\r\n')]);
	var filename = surveyCohort.label + ' (' + surveyCohort.candidates.length + ' candidates) — ' + daysAgo(0) + '.csv';

	if (window.navigator.msSaveOrOpenBlob) { // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
		window.navigator.msSaveBlob(blob, filename);
	}
	else {
		return $('<a/>')
			.attr("href",window.URL.createObjectURL(blob, {type: 'text/plain'}))
			.attr("download",filename)
			.text('Download CSV file: ' + filename);
	}
}

//===================================================
Keen.ready(function(){
	console.log('Sending queries!',queries);
	client.run(queries,function(err,response){
		if(err){
			console.log(err);
		}
		else{
			console.log('Received response!');
			for(var i=0; i<surveyCohorts.length; i++){
				getCandidates(i, response[i*2],response[(i*2)+1]);
			}

			$('#please-be-patient').hide();

			_.forEach(surveyCohorts, function(surveyCohort){
				var div = $('<div>').addClass('surveyCohort')
					.append($('<h3>').text(surveyCohort.label))
					.append($('<p>').text(surveyCohort.description))
					.append($('<p>').html(getDownloadLink(surveyCohort)));
				div.prependTo('#surveycohorts_container');
			});
		}
	});
});
