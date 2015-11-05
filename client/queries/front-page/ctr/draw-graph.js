'use strict';


module.exports = function drawGraph(data, el, keyToDraw, opts) {

	const keys = Object.keys(data[0].byLayout);
	const trend = [['timeframe', ...keys]];

	data.forEach((result) => {
		const values = Object.values(_.mapValues(result.byLayout, (dataForLayout, layout) => dataForLayout[keyToDraw]));
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
		crosshair: { focused: { color: '#3bc', opacity: 0.8 } }
	}, opts)

	const toggleColumn = function(col) {

		if (columns[col] == col) {
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
			if(i !== numberOfColumns-1) {
				toggleColumn(i);
			}
		}
	}



	draw();




	google.visualization.events.addListener(chart, 'select', function () {

		const sel = chart.getSelection();
		console.log('sel', sel);
			// if selection length is 0, we deselected an element
			if (sel.length > 0) {
			// if row is undefined, we clicked on the legend
			if (sel[0].row === null) {
				const col = sel[0].column;
				toggleColumn(col);
				draw()
			}
		}
	});
};
