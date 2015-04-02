/*global module process */

var _ = require('lodash');
var fs = require('fs');
var wrench = require('wrench');
var specsFiles = require('./scripts/findSpecs')("target/gen/test/")


var tsRefRegex = /path\s*=\s*["'](\.\.\/(src|test|examples).+\.ts)/g;

function getCapturingGroups(targetStr, regex, i) {
    var references = [];
    var matched;
    while (matched = regex.exec(targetStr)) {
        var currRef = matched[i];
        references.push(currRef);
    }
    return references;
}

function transformRefToInclude(ref) {
    var srcToGen = ref.replace("../", "target/gen/");
    var tsToJs = srcToGen.replace(".ts", ".js");
    return tsToJs;
}

function getIncludesFromTsRefsFile(fileName) {
    var contents = fs.readFileSync(fileName).toString();
    var refs = getCapturingGroups(contents, tsRefRegex, 1);
    var includes = refs.map(transformRefToInclude);
    return includes;
}

var coreIncludes = getIncludesFromTsRefsFile('./build/chevrotain.ts');

var allSrcsIncludes = coreIncludes.concat(specsFiles)


module.exports = function(config) {
    "use strict";


    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: ['bower_components/lodash/lodash.js'].concat(
            allSrcsIncludes,
            [
                {pattern: 'target/gen/**/*.map', included: false},
                {pattern: 'src/**/*.ts', included: false},
                {pattern: 'test/**/*.ts', included: false}
            ]),

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
