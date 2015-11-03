/* global Keen */

'use strict';

const homepageComponents = {
    'header': 'Header (inc Markets)',
    'lead-today': 'Top stories',
    'fastft': 'FastFT',
    'editors-picks': 'Editors Picks',
    'opinion': 'Opinion',
    'popular': 'Most Popular',
    'topic-life-arts': 'Life & Arts',
    'topic-markets': 'Markets',
    'topic-technology': 'Technology',
    'video-picks': 'Videos'
}

const render = (el, promiseOfData, friendlyChosenPeriod) => {

    const tables = {};
    const containerEl = document.createElement('div');
    containerEl.classList.add('o-grid-row');
    containerEl.innerHTML = `<h2 data-o-grid-colspan="12">Homepage Components</h2>`;
    el.appendChild(containerEl);

    const tableEl = document.createElement('table');
    tableEl.className = 'table table--front-page table--show-all ';
    tableEl.dataset.oGridColspan = '12';
    tableEl.innerHTML = `
    <thead>
    <tr>
    <th>Component</th>
    <th>Clicks ${friendlyChosenPeriod}</th>
    <th>% of users clicking on this ${friendlyChosenPeriod}</th>
    </tr>
    </thead>
    `;
    containerEl.appendChild(tableEl);

    tables['components'] = tableEl;

    promiseOfData
    .then(([users, uniqueClicks, clicks]) => {

        const sortedClicks = clicks.map(((day, index) => {
            return day.value.map(element => ({
                name: element['meta.domPath'],
                clicks: element.result,
                uniqueClicks: uniqueClicks[index].value.find((el) => {
                    return el['meta.domPath'] === element['meta.domPath'];
                }).result
            }))
            .sort((resultOne, resultTwo) => resultTwo.uniqueClicks - resultOne.uniqueClicks);
        }));

        var componentsTableBodyEl = document.createElement('tbody');
        // pull out the different 'components';

        var components = sortedClicks.map((day) => {
            return day.map(result => result.name.split(' | ')[0])
            .filter((componentName, i, componentNames) => !!homepageComponents[componentName] && componentNames.indexOf(componentName) === i)
            .map(componentName => {
                const elements = day
                .filter(result => result.name.split(' | ')[0] === componentName);
                return {
                    id: componentName,
                    name: homepageComponents[componentName],
                        // sum the clicks for this component
                    clicks: elements.reduce((total, result) => total + result.clicks, 0),
                    uniqueClicks: elements.reduce((total, result) => total + result.uniqueClicks, 0),
                    elements: elements
                };
            })
            .sort((componentOne, componentTwo) => componentTwo.uniqueClicks - componentOne.uniqueClicks);

        });

        componentsTableBodyEl.innerHTML = components[components.length - 1]
        .map(component => {
                // prettify name
                var componentName = component.name.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase());
                return `
                <tr class="table__body-row">
                <td><a href="https://next.ft.com/uk#domPath:${component.name}">${componentName}</a></td>
                <td>${component.clicks}</td>
                <td>${((100 / users[users.length - 1].value) * component.uniqueClicks).toFixed(2)}</td>
                </tr>
                <tr class="table__body-row">
                    <td colspan="3"><div class="js-component-chart-${component.id}"></div></td>
                </tr>
                `;
            })
        .join('');



        tables['components'].appendChild(componentsTableBodyEl);

        Object.keys(homepageComponents).forEach((key) => {
            const trendEl = document.querySelector(`.js-component-chart-${key}`);
            const data = components.map((day, index) => {
                const thisComp = day.find((comp)=> comp.id === key);
                return {
                    timeframe: users[index].timeframe,
                    value: parseFloat(((100 / users[index].value) * thisComp.uniqueClicks).toFixed(2))
                };
            });
            new Keen.Dataviz()
                .el(trendEl)
                .chartType('linechart')
                .parseRawData({
                    result: data
                })
                .title(homepageComponents[key] + ' CTR')
                .height(300)
                .chartOptions({
                    hAxis: {
                        format: 'EEE d',
                        title: 'Date'
                    },
                    vAxis: {
                        title: 'CTR (%)'
                    },
                    trendlines: {
                        0: {
                            color: 'green'
                        }
                    }
                })
                .render();

        })

    });



};

module.exports = {
    render
};
