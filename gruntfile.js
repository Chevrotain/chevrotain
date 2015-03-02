module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        karma: {
            options:  {
                configFile: 'karma.conf.js',
                singleRun:  true
            },
            default:  {
                browsers: ['Chrome', 'Firefox', 'IE']
            },
            coverage: {
                browsers:      ['Chrome'],
                preprocessors: {'gen/src/**/*.js': ['coverage']},
                reporters:     ['progress', 'coverage']
            },

            // TODO: modify the files loaded to the aggregated output of the release compiler
            release:  {}
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files:   {
                src: ['src/**/*.ts', 'examples/**/*.ts']
            }
        },

        ts: {
            default: {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts"],
                watch:  "src", //  TODO: the grunt-ts plugin only supports watching a single directory,
                               // this means the code needs to be moved to a single directory...
                outDir: "gen"
            },
            options: {
                target: "ES5",
                fast:   "never"

            }
        }
    });

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks("grunt-ts");

    // TODO: register dev task that performs full pre-commit flow
    // TODO: register release task that performs full release flow (maybe also publish to npm/other?)

};