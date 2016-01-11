import KeenQuery from 'n-keen-query';
import union from 'lodash/array/union';
import intersection from 'lodash/array/intersection';

function getMyFtUserUuidsThisWeek() {

	const myFtPageVisitorsQuery = 'dwell->select(user.uuid)->filter(page.location.hash>>myft)->time(7_days)->print(json)';
	const myFtPageVisitorsPromise = KeenQuery.execute(myFtPageVisitorsQuery);

	const myFtDailyEmailOpenersQuery = 'email->select(user.uuid)->filter(event=open)->filter(meta.emailType=daily)->time(7_days)->print(json)';
	const myFtDailyEmailOpenersPromise = KeenQuery.execute(myFtDailyEmailOpenersQuery);

	return Promise.all([myFtPageVisitorsPromise, myFtDailyEmailOpenersPromise]).then(results => {

		// todo why in the second column? ask rhys
		const myFtPageVisitors = results[0].rows.map(a => a[1]);
		const myFtDailyEmailOpeners = results[1].rows.map(a => a[1]);

		return union(myFtPageVisitors, myFtDailyEmailOpeners);
	})

}

export default function render () {
	const daysVisitedThisWeekGraph = new Keen.Dataviz()
		.el(document.querySelector('.js-days-visited-this-week'))
		.prepare();

	const daysVisitedThisWeekQuery = 'dwell->select(user.uuid)->time(7_days)->group(time.day)->print(json)';
	const daysVisitedThisWeekPromise = KeenQuery.execute(daysVisitedThisWeekQuery);

	Promise.all([getMyFtUserUuidsThisWeek(), daysVisitedThisWeekPromise]).then(result => {

		const myFtUsers = result[0];
		const allUsersVisitDays = result[1].rows;

		const myFtUsersVisitDays = [];
		allUsersVisitDays.forEach(((day, i) => {
			myFtUsersVisitDays[i] = intersection(myFtUsers, day[1]).length;
		}));

		const averageDaysVisited = myFtUsersVisitDays.reduce((a, b) => a + b, 0) / myFtUsers.length;

		daysVisitedThisWeekGraph
			.data({
				result: averageDaysVisited
			})
			.title('This week')
			.render();

	})
}
