'use strict';

var babelify = require('babelify');
var browserify = require('browserify');
var stringify = require('stringify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var prettyHrtime = require('pretty-hrtime');
var constants = require('./constants');
var handleErrors = require('./utils').handleErrors;

var startTime;

var BABEL_PRESET = constants.babelPreset;
var BUILD_DIR = constants.buildDir;
var OUTPUT = 'app.js';

var opts = {
	entries: ['app/scripts/app.js'],
	extensions: ['.js'],
	paths: ['./node_modules'],
	debug: true
};

var stringifyOpts = {
	extensions: ['.html']
};

module.exports = function(gulp, $) {
	var bundler = {
		w: null,
		init: function() {
			this.w = watchify(browserify(opts))
				.transform(babelify.configure(BABEL_PRESET))
				.transform(stringify(stringifyOpts))
			bundleLogger.start(OUTPUT);
		},
		bundle: function() {
			return this.w && this.w.bundle()
				.on('error', handleErrors)
				.on('end', function() {
					bundleLogger.end(OUTPUT);
				})
				.pipe(source(OUTPUT))
				.pipe(gulp.dest(BUILD_DIR + '/scripts'))
		},
		watch: function() {
			bundleLogger.watch(OUTPUT);
			this.w && this.w.on('update', this.bundle.bind(this));
		},
		stop: function() {
			return this.w && this.w.close();
		}
	};

	var bundleLogger = {
		start: function(filepath) {
			startTime = process.hrtime();
			$.util.log('Bundling', $.util.colors.green(filepath) + '...');
		},

		watch: function(bundleName) {
			$.util.log('Watching files required by', $.util.colors.yellow(bundleName));
		},

		end: function(filepath) {
			var taskTime = process.hrtime(startTime);
			var prettyTime = prettyHrtime(taskTime);
			$.util.log('Bundled', $.util.colors.green(filepath), 'in', $.util.colors.magenta(prettyTime));
		}
	}

  return bundler;
}
