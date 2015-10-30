/* global Keen */
'use strict';


const render = (el, promiseOfData) => {

    const usersEl = document.querySelector('.js-front-page-users');

    const usersMetric = new Keen.Dataviz()
        .title('Users today')
        .chartOptions({
            width: '100%'
        })
        .colors(['#eeeeee'])
        .el(usersEl)
        .prepare();

    const trendEl = document.querySelector('.js-front-page-users-chart');


    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('columnchart')
        .title('Users')
        .height(450)
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
    .then(([, usersByDay, , , , ]) => {


        const usersToday = usersByDay[usersByDay.length - 1].value;
        usersMetric
            .data({
                result: usersToday
            })
            .render();

        trendChart
            .data({
                result: usersByDay
            })
            .render();

    });

};

module.exports = {
    render
};
