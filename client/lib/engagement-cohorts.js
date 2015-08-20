'use strict';


// two buckets, < 1.5 and >= 1.5
var buckets = [
    {
        min: 1.5,
        label: 'At least 1.5 articles read'
    },
    {
        max: 1.5,
        label: 'Less than 1.5 articles read'
    }
];

module.exports = {
    buckets,
    extract: results => {
        var cohortsData = [];
        // in days
        var groupSize = 14;
        // pull out days
        results.result
            .map(result => result['time.day'])
            .filter((day, index, days) => days.indexOf(day) === index)
            .sort()
            .reverse()
            .forEach((day, index) => {
                if (index % groupSize === 0) {
                    cohortsData.unshift({
                        timeframe: {
                            end: day
                        },
                        value: buckets.map(bucket => ({
                            label: bucket.label,
                            result: 0
                        })),
                        users: {}
                    });
                }
                results.result
                    .filter(result => day === result['time.day'])
                    .forEach(result => {
                        var count = result.result;
                        if (!count) {
                            return;
                        }
                        var uuid = result['user.uuid'];
                        var user = cohortsData[0].users[uuid];
                        if (!user) {
                            cohortsData[0].users[uuid] = {
                                average: count,
                                totalDays: 1
                            };
                        } else {
                            // update average
                            var newTotalDays = user.totalDays + 1;
                            user.average = ((user.average * user.totalDays) + count) / newTotalDays;
                            user.totalDays = newTotalDays;
                        }
                    });
            });

        cohortsData.forEach(result => {
            Object.keys(result.users).forEach((uuid, index) => {
                // take our set of users from the initial period (i.e. ignore any new users)
                if (index !== 0 && !cohortsData[0].users[uuid]) {
                    return delete result.users[uuid];
                }
                var averageReadCount = result.users[uuid].average;
                result.value.some((value, index) => {
                    var bucket = buckets[index];
                    if (bucket.min && averageReadCount < bucket.min) {
                        return false;
                    } else if (bucket.max && averageReadCount >= bucket.max) {
                        return false;
                    }
                    value.result++;
                    return true;
                });
            });
        });

        // calculate value as a percentage
        cohortsData.forEach(result => {
            var totalCount = result.value.reduce((prev, value) => prev + value.result, 0);
            // convert result to percentage
            result.value.forEach(value => value.result = ((100 / totalCount) * value.result).toFixed(2));
        });

        return cohortsData;
    }
};