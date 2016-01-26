const filterByKeyValuePair = (data, key, value) => {
	return data.filter(element => element[key] === value);
};

module.exports = (data) => {
	const next = filterByKeyValuePair(data, 'channel', 'next');
	const ft = filterByKeyValuePair(data, 'channel', 'desktop');

	const nextAnons = filterByKeyValuePair(next, 'sub_cohort', '1');
	const ftAnons = filterByKeyValuePair(ft, 'sub_cohort', '1');

	const nextAnonsMobile = filterByKeyValuePair(nextAnons, 'mobile_device', 'Mobile Phone');
	const ftAnonsMobile = filterByKeyValuePair(ftAnons, 'mobile_device', 'Mobile Phone');

	return {
		nextAnons: nextAnons.length,
		ftAnons: ftAnons.length,
		nextAnonsMobile: nextAnonsMobile.length,
		ftAnonsMobile: ftAnonsMobile.length
	};
};
