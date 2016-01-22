'use strict';

module.exports = function(data, metric) {
	//curr[0] represents the "everything" graph
	const total = data.reduce((prev, curr) => prev + curr[metric.id], 0);
	metric.keenMetricContainer.data({
      result: total / data.length
  })
  .render();
};
