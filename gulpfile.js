'use strict';

var gulp = require('gulp');
require('gulp-watch');
var obt = require('origami-build-tools');

gulp.task('build', function () {
	obt.build(gulp, {
		js: './client/main.js',
		buildFolder: './static',
	});
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['build']);
});
