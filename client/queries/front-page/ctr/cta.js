'use strict';



const render = (el, promiseOfData) => {

    const tables = {};
    [['components', 'Component name'], ['elements', 'Dom path']].forEach(config => {
        var [type, colTitle] = config;
        var containerEl = document.createElement('div');
        containerEl.classList.add('o-grid-row');
        containerEl.innerHTML = `<h2 data-o-grid-colspan="12">Most clicked ${type} in the past week</h2>`;
        el.appendChild(containerEl);

        var tableEl = document.createElement('table');
        tableEl.className = 'table table--front-page';
        tableEl.dataset.oGridColspan = '12';
        tableEl.innerHTML = `
            <thead>
                <tr>
                    <th>${colTitle}</th>
                    <th>Clicks</th>
                    <th>% of users clicking on this</th>
                </tr>
            </thead>
        `;
        containerEl.appendChild(tableEl);

        tables[type] = tableEl;
    });

    // add component breakdown table
    var breakdownContainerEl = document.createElement('div');
    breakdownContainerEl.classList.add('o-grid-row');
    breakdownContainerEl.innerHTML = `<h2 data-o-grid-colspan="12">Component breakdown for the past week</h2>`;
    el.appendChild(breakdownContainerEl);

    var breakdownTableEl = document.createElement('table');
    breakdownTableEl.className = 'table table--front-page';
    breakdownTableEl.dataset.oGridColspan = '12';
    breakdownTableEl.innerHTML = `
        <thead>
            <tr>
                <th>Dom path</th>
                <th>Clicks</th>
                <th>% of users clicking this</th>
            </tr>
        </thead>
    `;
    breakdownContainerEl.appendChild(breakdownTableEl);
    tables['breakdown'] = breakdownTableEl;


    promiseOfData
    .then(([users, , uniqueClicks, clicks, ,]) => {


    var elementsTableBodyEl = document.createElement('tbody');
    elementsTableBodyEl.innerHTML = clicks
        .map(element => ({
            name: element['meta.domPath'],
            clicks: element.result,
            uniqueClicks: uniqueClicks.find((el) => {
                return el['meta.domPath'] === element['meta.domPath'];
            }).result
        }))
        .sort((resultOne, resultTwo) => resultTwo.uniqueClicks - resultOne.uniqueClicks)
        .map(result => `
            <tr class="table__body-row">
                <td><a href="https://next.ft.com/uk#domPath:${result['meta.domPath']}">${result.name}</a></td>
                <td>${result.clicks}</td>
                <td>${((100 / users) * result.uniqueClicks).toFixed(2)}</td>
            </tr>
        `)
        .join('');
    tables['elements'].appendChild(elementsTableBodyEl);

    var componentsTableBodyEl = document.createElement('tbody');
    // pull out the different 'components';
    var uniqueComponentClicks = uniqueClicks
    .map(result => result['meta.domPath'].split(' | ')[0])
    .filter((componentName, i, componentNames) => componentNames.indexOf(componentName) === i)
    .map(componentName => ({
        name: componentName,
            // sum the clicks for this component
            value: uniqueClicks
                .filter(result => result['meta.domPath'].split(' | ')[0] === componentName)
                .reduce((total, result) => total + result.result, 0)
        }))

    var components = clicks
    .map(result => result['meta.domPath'].split(' | ')[0])
    .filter((componentName, i, componentNames) => componentNames.indexOf(componentName) === i)
    .map(componentName => ({
        name: componentName,
            // sum the clicks for this component
            clicks: clicks
                .filter(result => result['meta.domPath'].split(' | ')[0] === componentName)
                .reduce((total, result) => total + result.result, 0),
            uniqueClicks: uniqueComponentClicks.find((comp) => {
                return comp.name === componentName;
            }).value,
            elements: clicks
                .filter(result => result['meta.domPath'].split(' | ')[0] === componentName)
                .map(element => ({
                    name: element['meta.domPath'],
                    clicks: element.result,
                    uniqueClicks: uniqueClicks.find((el) => {
                        return el['meta.domPath'] === element['meta.domPath'];
                    }).result
                }))
        }))
    .sort((componentOne, componentTwo) => componentTwo.uniqueClicks - componentOne.uniqueClicks);

    componentsTableBodyEl.innerHTML = components
    .map(component => {
            // prettify name
            var componentName = component.name.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase());
            return `
            <tr class="table__body-row">
                <td><a href="https://next.ft.com/uk#domPath:${component.name}">${componentName}</a></td>
                <td>${component.clicks}</td>
                <td>${((100 / users) * component.uniqueClicks).toFixed(2)}</td>
            </tr>
            `;
        })
    .join('');
    tables['components'].appendChild(componentsTableBodyEl);

    // add show all buttons
    Object.keys(tables).forEach(tableType => {
        var table = tables[tableType];
        var showAllEl = document.createElement('button');
        showAllEl.classList.add('table__button--show-all');
        showAllEl.textContent = 'Show all';
        table.appendChild(showAllEl);
        table.addEventListener('click', function (ev) {
            var target = ev.target;
            if (target.classList.contains('table__button--show-all')) {
                this.classList.add('table--show-all');
                target.parentNode.removeChild(target);
            }
        });
    });

    // add breakdown selector
    var componentSelectEl = document.createElement('select');
    components.forEach(component => {
        var componentName = component.name;
        var componentEl = document.createElement('option');
        componentEl.value = componentName;
        componentEl.textContent = componentName.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase());
        componentSelectEl.appendChild(componentEl);
    });
    tables['breakdown'].parentNode.insertBefore(componentSelectEl, tables['breakdown']);

    var breakdownTableBodyEl = document.createElement('tbody');
    tables['breakdown'].appendChild(breakdownTableBodyEl);

    // group components
    breakdownTableBodyEl.innerHTML = components
    .map(component => {
        return component.elements
        .sort((elementOne, elementTwo) => elementTwo.uniqueClicks - elementOne.uniqueClicks)
        .map(element => `
            <tr class="table__body-row" data-component="${component.name}">
                <td><a href="https://next.ft.com/uk#domPath:${element['meta.domPath']}">${element.name}</a></td>
                <td>${element.clicks}</td>
                <td>${((100 / users) * element.uniqueClicks).toFixed(2)}</td>
            </tr>
            `)
        .join('');
    })
    .join('');

    // handle for select change
    var componentHandler = function(ev) {
        Array.from(breakdownTableEl.querySelectorAll('tbody tr'))
        .forEach(el => el.style.display = el.dataset.component === ev.target.value ? 'table-row' : 'none');
    };
    componentSelectEl.addEventListener('change', componentHandler);
    componentSelectEl.dispatchEvent(new Event('change'));

});



};

module.exports = {
    render
};
