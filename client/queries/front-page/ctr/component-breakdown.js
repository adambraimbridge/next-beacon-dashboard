'use strict';



const render = (el, promiseOfData) => {

    const tables = {};
    [['components', 'Component name'], ['elements', 'Dom path']].forEach(config => {
        var [type, colTitle] = config;
        var containerEl = document.createElement('div');
        containerEl.classList.add('o-grid-row');
        containerEl.innerHTML = `<h2 data-o-grid-colspan="12">Most clicked ${type} today</h2>`;
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
    breakdownContainerEl.innerHTML = `<h2 data-o-grid-colspan="12">Component breakdown for today</h2>`;
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

        var elementsTableBodyEl = document.createElement('tbody');
        elementsTableBodyEl.innerHTML = sortedClicks[sortedClicks.length - 1].map(result => `
            <tr class="table__body-row">
            <td><a href="https://next.ft.com/uk#domPath:${result['meta.domPath']}">${result.name}</a></td>
            <td>${result.clicks}</td>
            <td>${((100 / users[users.length - 1].value) * result.uniqueClicks).toFixed(2)}</td>
            </tr>
            `)
        .join('');
        tables['elements'].appendChild(elementsTableBodyEl);

        var componentsTableBodyEl = document.createElement('tbody');
        // pull out the different 'components';

        var components = sortedClicks.map((day) => {
            return day.map(result => result.name.split(' | ')[0])
            .filter((componentName, i, componentNames) => componentNames.indexOf(componentName) === i)
            .map(componentName => {
                const elements = day
                .filter(result => result.name.split(' | ')[0] === componentName);
                return {
                    name: componentName,
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
        components[components.length - 1].forEach(component => {
            if(!component) {
                return;
            }
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
        breakdownTableBodyEl.innerHTML = components[components.length - 1]
        .map(component => {
            return component.elements
            .sort((elementOne, elementTwo) => elementTwo.uniqueClicks - elementOne.uniqueClicks)
            .map(element => `
                <tr class="table__body-row" data-component="${component.name}">
                <td><a href="https://next.ft.com/uk#domPath:${element['meta.domPath']}">${element.name}</a></td>
                <td>${element.clicks}</td>
                <td>${((100 / users[users.length - 1].value) * element.uniqueClicks).toFixed(2)}</td>
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
