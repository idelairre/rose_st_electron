'use strict';

var async = require('async');
var cloneDeep = require('lodash').cloneDeep;
var merge = require('merge2');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var packager = require('electron-packager');
var path = require('path');
var utils = require('./utils');
var babel = require('babel-core');
var os = require('os');
var constants = require('./constants');

var APP_NAME = constants.packageJson.name;
var BABEL_PRESET = constants.babelPreset;
var BUILD_DIR = constants.buildDir;
var ELECTRON_VERSION = constants.electronVersion;
var RELEASE_DIR = constants.releaseDir;
var RESOURCE_DIR = constants.resourceDir;
var TEMP_DIR = constants.tempDir;
var OUT_DIR;

var tasks = {
	buildElectron: function(callback) {
		utils.logger.start('Parsing electron files');
		async.each(['app/events.js', 'app/menu.js', 'app/index.js', 'app/gh-releases.js'], function(entry, callback) {
			var file = path.parse(entry).base;
			var filePath = BUILD_DIR + '/' + file;
			utils.logger.start('Parsing file', file);
			fs.readFile(entry, 'utf-8', function(error, data) {
				if (error) {
					utils.handleErrors(error);
					callback ? callback(error, null) : error;
					return;
				} else {
					data = babel.transform(data, BABEL_PRESET);
					utils.writeFile(filePath, data.code, callback);
				}
			});
		}, function(error) {
			if (error) {
				utils.handleErrors(error);
				callback ? callback(error, null) : error;
				return;
			} else {
				utils.logger.end('Finished parsing electron files');
				callback ? callback(null) : null;
			}
		});
	},

	buildRuntime: function(callback) {
		utils.logger.start('Building runtime');
		async.each(['node_modules/electron-prebuilt', 'node_modules/electron-debug', 'node_modules/electron-squirrel-startup'], function(entry, callback) {
			var filePath = BUILD_DIR + '/' + entry;
			utils.copyDir(entry, filePath, callback);
		}, function(error) {
			if (error) {
				utils.handleErrors(error);
				callback ? callback(error, null) : error;
				return;
			} else {
				utils.logger.end('Finished building runtime');
				callback ? callback(null) : null;
			}
		});
	},

	// Write a package.json for distribution
	packageJson: function(callback) {
		utils.logger.start('Copying package.json');

		function replacer(key, value) {
			if (key === 'devDependencies') {
				return undefined;
			}
			if (key === 'main') {
				return 'index.js';
			}
			if (key === 'environment' && process.env.NODE_ENV === 'production') {
				return 'production';
			}
			return value;
		}
		var json = cloneDeep(constants.packageJson);
		var filePath = BUILD_DIR + '/package.json';
		json.dependencies["babel-polyfill"] = "^6.3.14";

		utils.writeFile(filePath, JSON.stringify(json, replacer, 3), function(error) {
			if (error) {
				callback ? callback(error, null) : null;
				return;
			} else {
				return callback ? callback(null) : null;
			}
		});
	},

	install: function(callback) {
		utils.logger.start('Installing npm modules');
		exec('npm install', {
			cwd: './build'
		}, function(error, stdout, stderr) {
			if (error) {
				console.error('ERROR while installing npm modules:');
				console.error(error);
				utils.handleErrors(error)
				callback ? callback(error, null) : null;
			} else if (stderr) {
				console.error(stderr);
			}
			utils.logger.end('Finished installing npm modules' + stdout);
			return callback ? callback(null) : null;
		});
	},

	packageDist: function(callback) {
		utils.logger.start('Packaging distribution');
		var targets = ['win32', 'linux', 'darwin'];
		os.platform() === 'win32' ? targets = ['win32'] : null;
		async.each(targets, function(platform, callback) {
			OUT_DIR = RELEASE_DIR + '/' + platform;
			packager({
				asar: true,
				dir: BUILD_DIR,
				name: APP_NAME,
				arch: 'x64',
				platform: platform,
				out: (platform === 'linux' ? OUT_DIR + '/' + APP_NAME + '-linux-x64' + '/opt' : OUT_DIR),
				overwrite: true,
				version: ELECTRON_VERSION
			}, function done(error) {
				if (error) {
					utils.handleErrors(error);
					callback ? callback(error, null) : error;
					return;
				} else {
					utils.logger.end('Finished packaging ' + platform + ' distribution');
				}
			});
		}, function (error) {
			if (error) {
				console.log('well shit');
			} else {
				utils.logger.end('Finished packaging all distributions');
				return callback ? callback(null) : null;
			}
		});
	},
};

module.exports = function() {
	return {
		buildDist: function(callback) {
			utils.logger.start('Building electron files');
			async.waterfall([tasks.packageJson, tasks.install, tasks.buildElectron, tasks.buildRuntime, tasks.packageDist, tasks.copyCom], function(error, result) {
				if (error) {
					utils.handleErrors(error);
					callback ? callback(error, null) : null;
					return;
				} else {
					utils.logger.end('Finished building electron files');
					return callback ? callback(null) : null;
				}
			});
		},
		build: function(callback) {
			utils.logger.start('Building electron files');
			async.waterfall([tasks.packageJson, tasks.install, tasks.buildElectron, tasks.buildRuntime], function(error, result) {
				if (error) {
					utils.handleErrors(error);
					callback ? callback(error, null) : null;
					return;
				} else {
					utils.logger.end('Finished building electron files');
					return callback ? callback(null) : null;
				}
			});
		}
	}
}
