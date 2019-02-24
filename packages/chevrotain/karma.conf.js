module.exports = function(config) {
    "use strict"
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: "",

        // frameworks to use
        frameworks: ["mocha", "chai"],

        client: {
            mocha: {
                reporter: "html"
            }
        },

        files: ["test/test.config.js", "lib/chevrotainSpecs.js"],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ["progress"],

        // web server port
        port: 9979,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

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
        // TODO: conditional to add IE + Edge | Safari depending on current OS.
        browsers: process.env.CIRCLE_PROJECT_REPONAME
            ? ["ChromeHeadless"]
            : ["IE", "Chrome", "Firefox", "Edge"],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 10000000,
        browserNoActivityTimeout: 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    })
}
