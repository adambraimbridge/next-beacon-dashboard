/* global Keen */
'use strict';

const render = (el, promiseOfData) => {
    const percentageEl = document.createElement('div');
    percentageEl.classList.add('o-grid-row');
    percentageEl.innerHTML = '<h2 data-o-grid-colspan="12">Percentage of visitors who clicked on something</h2>';
    el.appendChild(percentageEl);

    const topLevelCharts = [
        {
            title: 'Today',
            colors: ['#49c5b1']
        },
        {
            title: 'Yesterday',
            colors: ['#91DCD0']
        }
    ].map(config => {
        const el = document.createElement('div');
        el.dataset.oGridColspan = '12 M6';
        percentageEl.appendChild(el);
        config.chart = new Keen.Dataviz()
            .el(el)
            .prepare();
        return config;
    });

    const trendEl = document.createElement('div');
    trendEl.dataset.oGridColspan = '12';
    percentageEl.appendChild(trendEl);
    const trendChart = new Keen.Dataviz()
        .el(trendEl)
        .chartType('linechart')
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d'
            }
        })
        .prepare();


    promiseOfData
    .then(([, usersByDay, , , clicksByUserAndDay]) => {

        topLevelCharts.forEach((topLevelChart, i) => {

            const clicksByUserOnDay = clicksByUserAndDay[clicksByUserAndDay.length - i - 1];
            const uniqueClicksOnDay = clicksByUserOnDay.value.filter((user) => {
                return user.result > 0;
            }).length;
            const usersOnDay = usersByDay[usersByDay.length - i - 1].value;

            topLevelChart.chart
                .data({
                    result: parseFloat(((100 / usersOnDay) * uniqueClicksOnDay).toFixed(1))
                })
                .title(topLevelChart.title)
                .colors(topLevelChart.colors)
                .render();
        });

        const trend = clicksByUserAndDay.map((result, index) => ({
            value: parseFloat(((100 / usersByDay[index].value) * result.value.filter((user) => {
                return user.result > 0;
            }).length).toFixed(1)),
            timeframe: result.timeframe
        }));

        trendChart
            .data({
                result: trend

            }).render();

    });
}

module.exports = {
    render
};
