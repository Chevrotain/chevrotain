var wrench = require('wrench')
var _ = require('lodash')
var specsFiles = require('./scripts/findSpecs')("release/tsc/test/")

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        karma: {
            options:  {
                configFile: 'karma.conf.js',
                singleRun:  true,
                browsers: ['Chrome', 'Firefox', 'IE']
            },
            dev_build:  {
            },
            coverage: {
                browsers:      ['Chrome'],
                preprocessors: {'gen/src/**/*.js': ['coverage']},
                reporters:     ['progress', 'coverage']
            },

            // TODO: modify the files loaded to the aggregated output of the release compiler
            release:  {
                options : {
                    files: ['libs/jshashtable-3.0.js', 'bower_components/lodash/lodash.js', 'release/chevrotain.js', 'release/chevrotainSpecs.js']
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files:   {
                src: ['src/**/*.ts', 'test/**/*.ts']
            }
        },

        ts: {
            options: {
                target: "ES5",
                fast:   "never"

            },
            dev_build:   {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!release/**/*.ts"],
                outDir: "gen"
            },

            release: {
                files:   {
                    'release/Chevrotain.js': ['build/chevrotain.ts'],
                    // this is the same as the 'build' process, all .ts --> .js in gen directory
                    // in a later step those files will be aggregated into separate components
                    'release/tsc':           ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!release/**/*.ts"]
                },
                options: {
                    declaration:    true,
                    removeComments: false,
                    sourceMap: false // due to UMD and concat generated headers the original source map will be invalid.
                }
            }
        },

        umd: {
            release: {
                options: {
                    src:            'release/chevrotain.js',
                    objectToExport: 'chevrotain',
                    amdModuleId:    'chevrotain',
                    globalAlias:    'chevrotain',
                    deps:           {
                        'default': ['_'],
                        // TODO: replace with https://github.com/flesler/hashmap as it also has UMD and can be used with AMD
                        amd:       ['lodash'],
                        cjs:       ['lodash'],
                        global:    ['_']
                    }
                }
            }
        },

        clean:  {
            dev_build:   ["src/gen"],
            release: ["release"]
        },
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            release: {
                files: {
                    'release/chevrotain.js':      ['release/chevrotain.js'],
                    'release/chevrotainSpecs.js': specsFiles
                }
            }
        }
    })

    grunt.loadNpmTasks('grunt-karma')
    grunt.loadNpmTasks('grunt-tslint')
    grunt.loadNpmTasks("grunt-ts")
    grunt.loadNpmTasks('grunt-umd')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-concat')

    grunt.registerTask('release', ['clean:release', 'ts:release', 'tslint', 'umd:release', 'concat:release', 'karma:release'])
    grunt.registerTask('dev_build', ['clean:dev_build', 'ts:dev_build', 'tslint', 'karma:dev_build'])

}