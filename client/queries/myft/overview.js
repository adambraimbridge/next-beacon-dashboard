import KeenQuery from 'n-keen-query';
import union from 'lodash/array/union';
import intersection from 'lodash/array/intersection';

function getMyFtUsersByWeek (lastHowManyWeeks) {
	const myFtPageVisitorsQuery = `dwell->select(user.uuid)->filter(page.location.hash>>myft)->interval(w)->time(${lastHowManyWeeks}_weeks)->print(json)`;
	const myFtPageVisitorsPromise = KeenQuery.execute(myFtPageVisitorsQuery);

	const myFtDailyEmailOpenersQuery = `email->select(user.uuid)->filter(event=open)->filter(meta.emailType=daily)->interval(w)->time(${lastHowManyWeeks}_weeks)->print(json)`;
	const myFtDailyEmailOpenersPromise = KeenQuery.execute(myFtDailyEmailOpenersQuery);

	return Promise.all([myFtPageVisitorsPromise, myFtDailyEmailOpenersPromise]).then(results => {

		const myFtPageVisitorsByWeek = results[0].rows;
		const myFtDailyEmailOpenersByWeek = results[1].rows;
		return myFtPageVisitorsByWeek.map((week, i) => {
			const weekTimeFrame = week[0];
			const myFtUsersThisWeek = union(week[1], myFtDailyEmailOpenersByWeek[i][1]);
			return [
				weekTimeFrame,
				myFtUsersThisWeek
			];
		})
	})
}

function getDaysVisitedForUserWeek (user, visitorsThisWeek) {
	return visitorsThisWeek
		.map(day => ~day.indexOf(user) ? 1 : 0)
		.reduce((a, b) => a + b, 0)
}

function getAverageDaysVisitedByUsersInWeek (users, visitorsThisWeek) {
	return users
			.map(user => getDaysVisitedForUserWeek(user, visitorsThisWeek))
			.reduce((a, b) => a + b, 0) / users.length;
}

export default function render () {
	const weeks = 12;
	const daysVisitedThisWeekGraph = new Keen.Dataviz()
		.el(document.querySelector('.js-days-visited-this-week'))
		.prepare();
	const daysVisitedLastWeekGraph = new Keen.Dataviz()
		.el(document.querySelector('.js-days-visited-last-week'))
		.prepare();

	const daysVisitedQuery = `dwell->select(user.uuid)->time(${weeks}_weeks)->interval(d)->print(json)`;
	const daysVisitedPromise = KeenQuery.execute(daysVisitedQuery);

	Promise.all([getMyFtUsersByWeek(weeks), daysVisitedPromise]).then(results => {

		const myFtUsersByWeek = results[0];
		const allUsersByDay = results[1].rows;

		const allUsersByWeekAndDay = [];
		for(let i = 0; i < weeks; i++) {
			allUsersByWeekAndDay.push(
				allUsersByDay
					.slice(i * 7, (i + 1) * 7)
					.map(day => day[1])
			)
		}

		const averagesOverTime = myFtUsersByWeek
			.map((week, i) => [
				week[0],
				getAverageDaysVisitedByUsersInWeek(week[1], allUsersByWeekAndDay[i])
			]);


		daysVisitedThisWeekGraph
			.data({
				result: averagesOverTime[averagesOverTime.length - 1][1]
			})
			.title('This week')
			.render();

		daysVisitedLastWeekGraph
			.data({
				result: averagesOverTime[averagesOverTime.length - 2][1]
			})
			.title('Last week')
			.render();

	})
}
