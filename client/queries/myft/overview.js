import KeenQuery from 'n-keen-query';
import union from 'lodash/array/union';
import intersection from 'lodash/array/intersection';

function getMyFtUsers(timeFrame) {
	const timeComponent = timeFrame ? `time(${timeFrame})->` : '';
	const myFtPageVisitorsQuery = `@comparePast(dwell->select(user.uuid)->filter(page.location.hash>>myft)->${timeComponent}print(json))`;
	const myFtPageVisitorsPromise = KeenQuery.execute(myFtPageVisitorsQuery);

	const myFtDailyEmailOpenersQuery = `@comparePast(email->select(user.uuid)->filter(event=open)->filter(meta.emailType=daily)->${timeComponent}print(json))`;
	const myFtDailyEmailOpenersPromise = KeenQuery.execute(myFtDailyEmailOpenersQuery);

	return Promise.all([myFtPageVisitorsPromise, myFtDailyEmailOpenersPromise]).then(results => {

		const myFtPageVisitors = {
			curr: results[0].queries[0].data.result,
			prev: results[0].queries[1].data.result
		};
		const myFtDailyEmailOpeners = {
			curr: results[1].queries[0].data.result,
			prev: results[1].queries[1].data.result
		};

		return {
			curr: union(myFtPageVisitors.curr, myFtDailyEmailOpeners.curr),
			prev: union(myFtPageVisitors.prev, myFtDailyEmailOpeners.prev)
		};
	})

}

export default function render () {
	const daysVisitedThisWeekGraph = new Keen.Dataviz()
		.el(document.querySelector('.js-days-visited-this-week'))
		.prepare();
	const daysVisitedLastWeekGraph = new Keen.Dataviz()
		.el(document.querySelector('.js-days-visited-last-week'))
		.prepare();

	const daysVisitedThisWeekQuery = '@comparePast(dwell->select(user.uuid)->time(7_days)->group(time.day)->print(json))';
	const daysVisitedThisWeekPromise = KeenQuery.execute(daysVisitedThisWeekQuery);

	Promise.all([getMyFtUsers('7_days'), daysVisitedThisWeekPromise]).then(result => {

		const myFtUsers = result[0];
		const allUsersVisitDays = {
			curr: result[1].queries[0].data.result.map(r => r.result),
			prev: result[1].queries[1].data.result.map(r => r.result)
		};

		function getAverageDaysVisited(timeKey) {
			return allUsersVisitDays[timeKey]
					.map(day => intersection(myFtUsers[timeKey], day).length)
					.reduce((a, b) => a + b, 0) / myFtUsers[timeKey].length;
		}

		const averageDaysVisitedThisWeek = getAverageDaysVisited('curr');
		const averageDaysVisitedLastWeek = getAverageDaysVisited('prev');

		daysVisitedThisWeekGraph
			.data({
				result: averageDaysVisitedThisWeek
			})
			.title('This week')
			.render();

		daysVisitedLastWeekGraph
			.data({
				result: averageDaysVisitedLastWeek
			})
			.title('Last week')
			.render();

	})
}
