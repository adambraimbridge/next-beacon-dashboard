'use strict';

module.exports = function(data, keenContainer, key) {

	const total = data.reduce((prev, curr) => prev + curr.byLayout.all[key], 0);
	keenContainer.data({
      result: total / data.length
  })
  .render();
}
