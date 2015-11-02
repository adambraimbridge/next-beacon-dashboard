/* global Keen */
'use strict';


const render = (el, promiseOfData) => {

    const clicksPerUserEl = document.querySelector('.js-front-page-clicks-per-user');

    const clicksPerUserMetric = new Keen.Dataviz()
        .title('Average clicks per user today')
        .chartOptions({
            width: '100%'
        })
        .colors(['#49c5b1'])
        .el(clicksPerUserEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-clicks-per-user-chart');


    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .height(450)
        .title('Average clicks per user on the Homepage')
        .chartOptions({
            hAxis: {
                format: 'EEE d'
            },
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();


    promiseOfData
    .then((
        [ , //users
        usersByDay,
        clicksByUserAndDay,
         , //viewsByDay
        ]) => {

        const clicksPerDay = clicksByUserAndDay.map((result) => (
            {
                clicks: result.value.reduce((prevVal, currentUser) => {
                    return prevVal + currentUser.result;
                }, 0)
            }
        ));

        const clicksOnDay = clicksPerDay[clicksPerDay.length - 1].clicks;

        const usersOnDay = usersByDay[usersByDay.length - 1].value;
        clicksPerUserMetric
            .data({
                result: parseFloat((clicksOnDay / usersOnDay).toFixed(1))
            })
            .render();

        trendChart
            .data({
                result: clicksPerDay.map((day, index) => ({
                    value: parseFloat((clicksPerDay[index].clicks / usersByDay[index].value).toFixed(1)),
                    timeframe: usersByDay[index].timeframe
                }))
            })
            .render();

    });

};

module.exports = {
    render
};
