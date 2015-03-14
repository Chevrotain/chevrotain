var wrench = require('wrench')
var _ = require('lodash')
var specsFiles = require('./scripts/findSpecs')("release/tsc/test/")

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        karma: {
            options:   {
                configFile: 'karma.conf.js',
                singleRun:  true,
                browsers:   ['Chrome']
            },
            dev_build: {},
            coverage_release:  {
                options: {
                    files: ['bower_components/lodash/lodash.js', 'release/chevrotain.js', 'release/chevrotainSpecs.js']
                },
                browsers:      ['Chrome'],
                preprocessors: {'release/chevrotain.js': ['coverage']},
                reporters:     ['progress', 'coverage']
            },

            // TODO: modify the files loaded to the aggregated output of the release compiler
            release:   {
                options: {
                    files: ['bower_components/lodash/lodash.js', 'release/chevrotain.js', 'release/chevrotainSpecs.js'],
                    browsers:   ['Chrome', 'Firefox', 'IE']
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
            options:   {
                target: "ES5",
                fast:   "never"

            },
            dev_build: {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!release/**/*.ts"],
                outDir: "gen"
            },

            release: {
                files:   {
                    'release/chevrotain.js': ['build/chevrotain.ts'],
                    // this is the same as the 'build' process, all .ts --> .js in gen directory
                    // in a later step those files will be aggregated into separate components
                    'release/tsc':           ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!release/**/*.ts"]
                },
                options: {
                    declaration:    true,
                    removeComments: false,
                    sourceMap:      false // due to UMD and concat generated headers the original source map will be invalid.
                }
            }
        },

        umd: {
            release: {
                options: {
                    src:            'release/chevrotain.js',
                    template:       'scripts/umd.hbs',
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
            dev_build: ["gen"],
            release:   ["release"]
        },
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */\n',

                process: function fixTSModulePatternForCoverage(src, filePath) {
                    // prefix (lang = chevrotain.lang || (chevrotain.lang = {}) with /* istanbul ignore next */
                    var fixed2PartsModules = src.replace(
                        /(\((\w+) = (\w+\.\2) \|\|) (\(\3 = \{\}\)\))/g, "/* istanbul ignore next */ $1 /* istanbul ignore next */ $4")

                    var fixedAllModulesPattern = fixed2PartsModules.replace(
                        /(\(chevrotain \|\| \(chevrotain = \{\}\)\);)/g, "/* istanbul ignore next */ $1")

                    var fixedTypeScriptExtends = fixedAllModulesPattern.replace("if (b.hasOwnProperty(p)) d[p] = b[p];",
                        "/* istanbul ignore next */ " + " if (b.hasOwnProperty(p)) d[p] = b[p];")

                    // TODO: try to remove this with typescript 1.5+. this replace is done in the grunt file due to bug in tsc 1.4.1
                    // TODO: that in certain situations removes the comments.
                    // very little point in testing this, this is a pattern matching functionality missing in typescript/javascript
                    // if the code reaches that point it will go "boom" which is the purpose, the going boom part is not part
                    // of the contract, it just makes sure we fail fast if we supply invalid arguments.
                    var fixedNoneExhaustive = fixedTypeScriptExtends.replace(/(default\s*:\s*throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                        "/* istanbul ignore next */ $1")

                    fixedNoneExhaustive = fixedNoneExhaustive.replace(/(throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                        "/* istanbul ignore next */ $1")

                    return fixedNoneExhaustive
                }
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

    grunt.registerTask('release', ['clean:release', 'ts:release', 'tslint', 'umd:release', 'concat:release', 'karma:coverage_release'])
    grunt.registerTask('dev_build', ['clean:dev_build', 'ts:dev_build', 'tslint', 'karma:dev_build'])

}