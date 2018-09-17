var os = require("os")
var ifaces = os.networkInterfaces()

var ipAddresses = []
// based on https://stackoverflow.com/a/8440736
Object.keys(ifaces).forEach(function(ifname) {
    var alias = 0

    ifaces[ifname].forEach(function(iface) {
        if ("IPv4" !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return
        }
        ipAddresses.push(iface.address)
    })
})

module.exports = function(config) {
    "use strict"
    var fs = require("fs")

    var customLaunchers = {
        SL_Chrome: {
            base: "SauceLabs",
            browserName: "chrome",
            version: "latest",
            platform: "OS X 10.13"
        },
        SL_InternetExplorer: {
            base: "SauceLabs",
            browserName: "internet explorer",
            version: "latest",
            platform: "Windows 10"
        },
        SL_EDGE: {
            base: "SauceLabs",
            browserName: "MicrosoftEdge",
            platform: "Windows 10",
            version: "latest"
        },
        SL_FireFox: {
            base: "SauceLabs",
            browserName: "firefox",
            version: "latest",
            platform: "OS X 10.13"
        },
        SL_SAFARI10: {
            base: "SauceLabs",
            browserName: "safari",
            platform: "OS X 10.13",
            version: "latest"
        }
    }

    // Use ENV vars on Travis and sauce.json locally to get credentials
    if (!process.env.SAUCE_USERNAME) {
        if (!fs.existsSync("sauce.json")) {
            console.log(
                "Create a sauce.json with your credentials based on the sauce-sample.json file."
            )
            process.exit(1)
        } else {
            process.env.SAUCE_USERNAME = require("./sauce").username
            process.env.SAUCE_ACCESS_KEY = require("./sauce").accessKey
        }
    }

    var sauceConfig = {
        testName: "Chevrotain-CI",
        retryLimit: 3,
        recordVideo: false,
        recordScreenshots: false
    }

    if (process.env.TRAVIS) {
        sauceConfig.build =
            "TRAVIS #" +
            process.env.TRAVIS_BUILD_NUMBER +
            " (" +
            process.env.TRAVIS_BUILD_ID +
            ")"
    }

    // TODO: this does not actually seem to work... if it would work we can use filtering by tag name in the badge.
    if (
        process.env.TRAVIS_BRANCH === "master" &&
        process.env.TRAVIS_PULL_REQUEST !== "false"
    ) {
        console.log("Sauce Labs results will be reported in the badge")
        sauceConfig.tags = ["master"]
    }

    config.set({
        sauceLabs: sauceConfig,

        // base path, that will be used to resolve files and exclude
        basePath: "",

        // frameworks to use
        frameworks: ["mocha", "chai"],

        files: ["test/test.config.js", "dev/chevrotainSpecs.js"],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ["progress", "saucelabs"],

        // Hack for SauceLabs seems that Safari and IE-Edge refuse to connect to localhost with SauceLabs connect.
        // but will work if given the actual local network IP...
        hostname: ipAddresses[0],

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
        browsers: Object.keys(customLaunchers),

        customLaunchers: customLaunchers,

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 10000000,
        browserNoActivityTimeout: 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    })
}
