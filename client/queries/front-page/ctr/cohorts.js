/* global Keen */
'use strict';

const render = (el, promiseOfData) => {
    const cohortsEl = document.createElement('div');
    cohortsEl.classList.add('o-grid-row');
    cohortsEl.innerHTML = '<h2 data-o-grid-colspan="12">Percentage of visitors who clicked on something X times</h2>';
    el.appendChild(cohortsEl);

    const cohortsGraphEl = document.createElement('div');
    cohortsGraphEl.dataset.oGridColspan = '12';
    cohortsEl.appendChild(cohortsGraphEl);
    const cohortsGraph = new Keen.Dataviz()
        .chartType('columnchart')
        .el(cohortsGraphEl)
        .height(450)
        .chartOptions({
            isStacked: false,
            hAxis: {
                format: 'EEEE'
            }
        })
        .prepare();

    promiseOfData
    .then(([, usersByDay, , , clicksByUserAndDay]) => {

        const cohortResults = clicksByUserAndDay.map((result, day) => {
            const newValue = new Array(0, 0, 0, 0, 0);
            let totalUsersClicking = 0;
            let rest = 0;
            result.value.forEach(value => {
                if(value.result > 0) {
                    totalUsersClicking += 1;
                }
                if (value.result < newValue.length) {
                    newValue[value.result] += 1;
                } else {
                    rest += 1;
                }
            });
            const newResult = Object.assign({}, result);

            //clicksByUserAndDay includes users who didn't visit the site at all that day
            // so recalculate those who didn't click anything
            newValue[0] = usersByDay[day].value - totalUsersClicking;


            newResult.value = newValue.map((value, i) => ({
                clicks: i,
                result: (100 / usersByDay[day].value) * value
            }));

            newResult.value.push({
                clicks: `${newValue.length} or more`,
                result: (100 / usersByDay[day].value) * rest
            });
            return newResult;
        });

        const cohortsEl = document.createElement('div');
        cohortsEl.dataset.oGridColspan = '12';
        el.appendChild(cohortsEl);
        cohortsGraph
            .data({ result: cohortResults })
            .render();
    });
};

module.exports = {
    render
};
