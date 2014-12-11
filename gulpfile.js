var gulp = require('gulp');
var watch = require('gulp-watch');
var obt = require('origami-build-tools');

gulp.task('build', function () {
	obt.build(gulp, {
		js: './src/main.js',
		buildFolder: './static',
	});
});

gulp.task('watch', function() {
	gulp.watch('./src/**/*', ['build']);
});
