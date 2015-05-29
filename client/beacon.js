"use strict";
	
var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});

var container = document.getElementById("my_chart"); 

switch (location.pathname) {
	
	case '/graph/uniques':

		Keen.ready(function(){

			var todayQuery = new Keen.Query("count_unique", {
				eventCollection: "dwell",
				target_property: "user.erights",
				timeframe: "today"
			});
			
			var weeklyQuery = new Keen.Query("count_unique", {
				eventCollection: "dwell",
				target_property: "user.erights",
				timeframe: "yesterday"
			});

			var today = document.createElement('div');
			container.appendChild(today);
			
			var weekly = document.createElement('div');
			container.appendChild(weekly);

			client.draw(todayQuery, today, { 
			    title: "Unique users today"
			});
			
			client.draw(weeklyQuery, weekly, { 
			    title: "Unique users yesterday",
				color: ['#49c5b1']
			});

		}); 
	
		break;

	default:
		console.log('unknown graph');
}

