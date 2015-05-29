"use strict";

console.log('ok');

switch (location.pathname) {
	
	case '/graph/uniques':
		var client = new Keen({
			projectId: keen_project,
			readKey: keen_read_key
		});
		Keen.ready(function(){

			var query = new Keen.Query("count_unique", {
				eventCollection: "dwell",
				target_property: "user.erights",
				timeframe: "today"
			});

			client.draw(query, document.getElementById("my_chart"), { 
			    title: "Unique users today"
			});

		}); 
	
		break;

	default:
		console.log('unknown graph');
}

