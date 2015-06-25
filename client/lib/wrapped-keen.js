/* global Keen, keen_project, keen_read_key */

'use strict';

var client = new Keen({
	projectId: keen_project,
	readKey: keen_read_key
});


['run'].forEach(function (key) {
	var func = client[key];

	client[key] = function (...args) {
		var cb = args[func.length - 1];
		if (typeof cb !== 'function') {
			cb = function (){};
		}
		return new Promise(function (resolve, reject) {
			args[func.length - 1] = function (err, res) {
				if (err) {
					reject(err);
					cb.call(this, err);
				} else {
					resolve(res);
					cb.call(this, null, res);
				}
			};
			func.apply(client, args);
		});
	};
});

module.exports = client;
