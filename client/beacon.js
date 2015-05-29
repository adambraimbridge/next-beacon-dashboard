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
			
			var yesterdayQuery = new Keen.Query("count_unique", {
				eventCollection: "dwell",
				target_property: "user.erights",
				timeframe: "yesterday"
			});
			
			var averageQuery = new Keen.Query("count_unique", {
				eventCollection: "dwell",
				target_property: "user.erights",
				timeframe: "last_14_days",
				interval: "daily",
				filters: [{ "property_name":"time.weekday", "operator":"eq", "property_value":true }]
			});

			var today = document.createElement('div');
			container.appendChild(today);
			
			var yesterday = document.createElement('div');
			container.appendChild(yesterday);

			var average = document.createElement('div');
			container.appendChild(average);
			
			client.draw(todayQuery, today, { 
			    title: "Unique users today"
			});
			
			client.draw(yesterdayQuery, yesterday, { 
			    title: "Unique users yesterday",
				colors: ['#77C9BC']
			});
	
			client.run(averageQuery, function (err, results) { 
					console.log(err, results);
					var sum = results.result.map(function (c) {
						return c.value;
					}).reduce(function (a, b) {
						return a + b
					});
					var chart = new Keen.Dataviz()
						.el(average)
						.parseRawData({ result: sum / 10 })
						.chartType("metric")
						.colors(["#92CBC2"])
						.title("14 weekday average uniques")
						.render();
			});

		}); 
	
		break;

	default:
		console.log('unknown graph');
}

