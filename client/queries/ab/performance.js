'use strict';

var volume = require('./performance/volume');
var frequency = require('./performance/frequency');
var other = require('./performance/other');

module.exports.render = function(){
	volume.run();
	frequency.run();
	other.run();
};
