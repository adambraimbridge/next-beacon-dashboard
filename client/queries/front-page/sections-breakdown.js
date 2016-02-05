/* global Keen */
const client = require('../../lib/wrapped-keen');

const createFilter = ((name, operator, value) => ({
	property_name: name,
	operator: operator,
	property_value: value
}));

const sections = [
	'top-stories',
	'opinion',
	'myft',
	'editors-picks',
	'most-popular',
	'technology',
	'markets',
	'life-and-arts',
	'video'
];

const calculatePercentage = (value, total, precision = 2) => parseFloat(((100 / total) * value).toFixed(precision), 10);

const convertResults = res => {
	// sum clicks for each component
	const absoluteResults = res.result.map(dailyResult => {
		dailyResult.value = dailyResult.value
			.reduce((values, currentValue) => {
				const currentSection = sections.find(section => currentValue['meta.domPath'].startsWith(section));
				if (currentSection) {
					const sectionValue = values.find(value => value.section === currentSection);
					if (sectionValue) {
						sectionValue.result += currentValue.result;
					} else {
						values.push({
							section: currentSection,
							result: currentValue.result
						});
					}
				}
				return values;
			}, [])
			.sort((valueOne, valueTwo) => sections.indexOf(valueOne.section) - sections.indexOf(valueTwo.section));
		return dailyResult;
	});

	// calculate clicks as a percentage
	const percentageResults = absoluteResults
		.map(dailyResult => {
			const total = dailyResult.value
				.reduce((totalClicks, currentValue) => totalClicks += currentValue.result, 0);
			const newValue = dailyResult.value
				.map(value => Object.assign({}, value, { result: calculatePercentage(value.result, total) }))
				.reverse();
			return Object.assign({}, dailyResult, { value: newValue });
		});

	return [absoluteResults, percentageResults];
};

const graphResult = ([absoluteGraph, percentageGraph], [absoluteResults, percentageResults]) => {
	absoluteGraph
		.data({ result: absoluteResults })
		.render();
	percentageGraph
		.data({ result: percentageResults })
		.render();
};

const render = () => {
	const query = new Keen.Query('count', {
		eventCollection: 'cta',
		filters: [createFilter('page.location.type', 'eq', 'frontpage')],
		groupBy: 'meta.domPath',
		interval: 'daily',
		timeframe: 'previous_28_days'
	});

	const absoluteGraph = new Keen.Dataviz()
			.chartType('linechart')
			.el(document.getElementById('absolute'))
			.height(450)
			.chartOptions({
				hAxis: { format: 'EEE d' }
			})
			.title('Number of clicks')
			.prepare();

	const percentageGraph = new Keen.Dataviz()
		.chartType('areachart')
		.el(document.getElementById('percentage'))
		.height(450)
		.chartOptions({
			hAxis: { format: 'EEE d' },
			isStacked: true
		})
		.title('Percentage of clicks')
		.prepare();

	client.run(query)
		.then(convertResults)
		.then(graphResult.bind(null, [absoluteGraph, percentageGraph]));
};

module.exports = {
	render
};
