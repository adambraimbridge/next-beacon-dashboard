const filterByKeyValuePair = (data, key, value) => {
	return data.filter(element => element[key] === value);
};

const aggregateValues = (data, key) => {
	return data.reduce((accumulator, element) => {
		accumulator[element[key]] = (accumulator[element[key]] || 0) + 1;
		return accumulator;
	}, {});
};

module.exports = (data) => {
	const nextData = filterByKeyValuePair(data, 'channel', 'next');
	const nextAnonData = filterByKeyValuePair(nextData, 'sub_cohort', '1');
	const allDataTypes = Object.keys(nextAnonData[0]);
	const unwantedDataTypes = ['visit_id', 'sub_cohort'];

	return allDataTypes.map(dataType => {
		if(unwantedDataTypes.indexOf(dataType) === -1) {
			return { [dataType]: aggregateValues(nextAnonData, dataType) };
		}
	});
};
