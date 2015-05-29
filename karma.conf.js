/*global module process */

var _ = require('lodash');
var fs = require('fs');
var wrench = require('wrench');
var specsFiles = require('./scripts/findSpecs')("bin/gen/test/", "test")
var exampleSpecsFiles = require('./scripts/findSpecs')("bin/gen/examples/", "examples")
var findRefs = require('./scripts/findRefs')

var coreIncludes = findRefs('./build/chevrotain.ts', "bin/gen/");
var ecma5Includes = findRefs('./build/ecma5.ts', "bin/gen/");

exampleSpecsFiles = _.reject(exampleSpecsFiles, function(item) {
    return _.contains(item, "ecmascript5") && !_.contains(item, "spec")
})

var allSrcsIncludes = coreIncludes.concat(ecma5Includes, specsFiles, exampleSpecsFiles)


module.exports = function(config) {
    "use strict";


    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: ['bower_components/lodash/lodash.js'].concat(
            [
                {pattern: 'bin/gen/**/*.map', included: false},
                {pattern: 'src/**/*.ts', included: false},
                {pattern: 'test/**/*.ts', included: false},
                {pattern: 'examples/**/*.ts', included: false}
            ],
            allSrcsIncludes),

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress'],

        // web server port
        port: 9979,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
        browsers: ['Chrome'],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout:           10000000,
        browserNoActivityTimeout: 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    });
};
