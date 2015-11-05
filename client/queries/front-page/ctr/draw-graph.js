/* global google, $ */

'use strict';


module.exports = function drawGraph(data, el, keyToDraw, opts) {
  const expectedLayoutOrder = ['all', 'default', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

	const keys = Object.keys(data[0].byLayout).sort((a, b) => expectedLayoutOrder.indexOf(a)-expectedLayoutOrder.indexOf(b));


	const trend = [['timeframe', ...keys]];

	data.forEach((result) => {
		const layouts = Object.values(result.byLayout)
			.sort((a, b) => expectedLayoutOrder.indexOf(a.layout)-expectedLayoutOrder.indexOf(b.layout));

		const values = layouts.map((dataForLayout) => dataForLayout[keyToDraw]);

		trend.push([new Date(result.timeframe.end), ...values]);
	});


	const chart = new google.visualization.LineChart(el);

	const columns = [];
	const series = {};

	const graphData = google.visualization.arrayToDataTable(trend);

	const options = Object.assign({
		height: 500,
		hAxis: {
			format: 'EEE d',
			title: 'Date',
			showTextEvery: 1
		},
		crosshair: { trigger: 'both' }
	}, opts);

	const toggleColumn = function(col) {

		if (columns[col] === col) {
		// hide the data series
			columns[col] = {
				label: graphData.getColumnLabel(col),
				type: graphData.getColumnType(col),
				calc: function () {
					return null;
				}
			};

			// grey out the legend entry
			series[col - 1].color = '#CCCCCC';
		} else {
			// show the data series
			columns[col] = col;
			series[col - 1].color = null;
		}
	}

	const draw = function() {
		const view = new google.visualization.DataView(graphData);
		view.setColumns(columns);
		chart.draw(view, Object.assign(options, { series: series}));
	}

	const numberOfColumns = graphData.getNumberOfColumns()
	for (let i = 0; i < numberOfColumns; i++) {
		columns.push(i);
		if (i > 0) {
			series[i - 1] = {};
			if(i !== 1) {
				toggleColumn(i); //Turn off all but the first (total)
			}
		}
	}



	draw();

	//enable the toggles
	$('.js-front-page-layout-toggles').removeClass('is-hidden');

	$('.js-front-page-layout-toggles .toggle-line').change((e) => {
		toggleColumn(parseInt(e.currentTarget.getAttribute('data-column')));
		draw();
	});

};
