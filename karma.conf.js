/*global module process */

var fs = require('fs');
var wrench = require('wrench');
var _ = require('lodash');

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function validateAllSpecsHaveBeenIncluded(actualSpecsIncludes) {
    allFileInGenTest = wrench.readdirSyncRecursive('gen/test');

    var specWithLowerCase = allFileInGenTest.filter(function (item) {
        return endsWith(item, 'spec.js');
    });

    if (specWithLowerCase.length > 0) {
        console.log(specWithLowerCase);
        throw new Error("some Specification files have been named with a lowerCase 'spec' instead of 'Spec', this may cause problems in linux");
    }

    var expectedSpecs = allFileInGenTest.filter(function (item) {
        return endsWith(item, 'Spec.js');
    });

    expectedSpecs = expectedSpecs.map(function (item) {
        return  "gen/test/" + item
    });

    expectedSpecs = expectedSpecs.map(function (item) {
        return item.replace(/\\/g, '/');
    });

    var inActualButNotInExpected = _.difference(actualSpecsIncludes, expectedSpecs);
    var inExpectedButNotInActual = _.difference(expectedSpecs, actualSpecsIncludes);

    if (!_.isEmpty(inActualButNotInExpected) || !_.isEmpty(inExpectedButNotInActual)) {
        console.log("mismatch between spec includes from .ts specs ref file and contents of gen directory\n" +
            "you may need to clean the gen directory or add a missing include to the .ts specs ref file",
            inActualButNotInExpected, inExpectedButNotInActual);
        throw new Errors("SPEC INCLUDES MISMATCH!");
    }
}

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
    var srcToGen = ref.replace("../", "gen/");
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
var specIncludes = getIncludesFromTsRefsFile('./build/chevrotainSpecs.ts');
var coreSpecUtilsIncludes = getIncludesFromTsRefsFile('./build/chevrotainSpecsUtils.ts');
var examples = getIncludesFromTsRefsFile('./build/chevrotainExamples.ts');
var examplesSpecs = getIncludesFromTsRefsFile('./build/chevrotainExamplesSpecs.ts');

var allSrcsIncludes = coreIncludes.concat(coreSpecUtilsIncludes, specIncludes, examples, examplesSpecs);

validateAllSpecsHaveBeenIncluded(specIncludes);

module.exports = function (config) {
    "use strict";

    var browsers;

    var preProcessors;
    if (process.env.COVERAGE) {
        preProcessors = {
            'gen/src/**/*.js': ['coverage']
        }
    }
    else {
        preProcessors = {}
    }

    var excludes = [];

    // run mode, avoid errors from issues with map files syntax
    if (!process.env.DEBUG) {
        excludes.push('**/*.ts');
        excludes.push('**/*.map');
    }

    browsers = ['Chrome'];
    if (process.env.FIREFOX) {
        browsers = ['Firefox']
    }
    else if (process.env.CANARY) {
        browsers = ['ChromeCanary'];
    }

    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: ['libs/*.js'].concat(
            // all production code
            allSrcsIncludes,
            [
                // source maps and sources for typeScript debugging
                // * these will be excluded in modes other then debug as they cause issues to the karma runner
                'gen/**/*.map',
                'src/**/*.ts',
                'test/**/*.ts'
            ]),


        // list of files to exclude
        exclude: excludes,

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress', 'coverage'],

        preprocessors: preProcessors,

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
        browsers: browsers,

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 10000000,
        browserNoActivityTimeout: 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    });
};
