const filterByValue = (data, key, value) => {
  return data.filter(jsonObj => {
    return jsonObj[key] == value;
  });
};

const resultsFor = (data, key) => {
  return data.reduce((accumulator, element) => {
    accumulator[element[key]] = (accumulator[element[key]] || 0) + 1;
    return accumulator;
  }, {});
};

module.exports = function (data) {
  const nextData = filterByValue(data, 'channel', 'next');

  const nextAnonData = filterByValue(nextData, 'sub_cohort', '1');

  return {
    total: nextAnonData.length,
    mobileDevice: resultsFor(nextAnonData, 'mobile_device'),
    attractionType: resultsFor(nextAnonData, 'attraction_type1'),
    hurdle: resultsFor(nextAnonData, 'hurdle'),
    segID: resultsFor(nextAnonData, 'last_segid')
  };
};
