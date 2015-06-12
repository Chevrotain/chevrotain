var _ = require('lodash')
var findRefs = require('./scripts/findRefs')
var specsFiles = require('./scripts/findSpecs')("bin/tsc/test/", "test")
var exampleSpecsFiles = require('./scripts/findSpecs')("bin/tsc/examples/", "examples")

var ecma5Includes = findRefs('./build/ecma5.ts', "bin/tsc/");

exampleSpecsFiles = _.reject(exampleSpecsFiles, function(item) {
    return _.contains(item, "ecmascript5") && !_.contains(item, "spec")
})

exampleSpecsFiles = ecma5Includes.concat(exampleSpecsFiles)

// TODO: this is a bit ugly, but including the root and then performing negation
//       seems to cause inclusion of things outside the root...
var githubReleaseFiles = ['./package.json',
    './LICENSE.txt',
    "./bin/chevrotain.d.ts",
    "./bin/chevrotain.js",
    './readme.md'
]

module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')
    var bower = grunt.file.readJSON('bower.json')

    if (pkg.dependencies.lodash !== bower.dependencies.lodash) {
        throw Error("mismatch in bower and npm lodash dependency version")
    }

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        karma: {
            options:   {
                configFile: 'karma.conf.js',
                singleRun:  true,
                browsers:   ['Chrome']
            },
            dev_build: {},

            tests_on_browsers: {
                options: {
                    files:    ['bower_components/lodash/lodash.js', 'bin/chevrotain.js', 'bin/chevrotainSpecs.js'],
                    browsers: ['Chrome', 'Firefox', 'IE']
                }
            }
        },

        jasmine_node: {
            node_release_tests: {
                options: {
                    coverage:          {
                        reportFile: 'coverage.json',
                        print:      'both', // none, summary, detail, both
                        relativize: true,
                        thresholds: {
                            statements: 100,
                            branches:   0,
                            lines:      100,
                            functions:  100
                        },
                        reportDir:  'bin/coverage',
                        report:     [
                            'lcov'
                        ],
                        collect:    [ // false to disable, paths are relative to 'reportDir'
                            '*coverage.json'
                        ],
                        excludes:   []
                    },
                    forceExit:         true,
                    match:             '.',
                    matchAll:          false,
                    specFolders:       ['bin'],
                    extensions:        'js',
                    specNameMatcher:   'tainSpecs', // to only run the aggregated specs
                    captureExceptions: true
                },
                src:     ['bin/chevrotain.js']
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files:   {
                // performance_spec causes issues with TS-Lint randomly crashing due to a very large sample string it contains.
                src: ['src/**/*.ts', 'test/**/*.ts', 'examples/**/*.ts', '!test/performance/performance_spec.ts']
            }
        },

        ts: {
            options:   {
                bin:  "ES5",
                fast: "never"

            },
            dev_build: {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!bin/**/*.ts"],
                outDir: "bin/gen"
            },

            release: {
                src:     ['build/chevrotain.ts'],
                out:     'bin/chevrotain.js',
                options: {
                    declaration:    true,
                    removeComments: false,
                    sourceMap:      false // due to UMD and concat generated headers the original source map will be invalid.
                }
            },

            // this is the same as the 'build' process, all .ts --> .js in gen directory
            // in a later step those files will be aggregated into separate components
            release_test_code: {
                src:     ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!bin/**/*.ts"],
                outDir:  "bin/tsc",
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
                    src:            'bin/chevrotain.js',
                    template:       'scripts/umd.hbs',
                    objectToExport: 'API',
                    amdModuleId:    'chevrotain',
                    globalAlias:    'chevrotain',
                    deps:           {
                        'default': ['_'],
                        amd:       ['lodash'],
                        cjs:       ['lodash'],
                        global:    ['_']
                    }
                }
            },

            release_specs: {
                options: {
                    src:      'bin/chevrotainSpecs.js',
                    template: 'scripts/umd.hbs',
                    deps:     {
                        'default': ['_', 'config', 'chevrotain'],
                        amd:       ['lodash', '../test.config.js', 'chevrotain'],
                        cjs:       ['lodash', '../test.config.js', './chevrotain'],
                        global:    ['_', "config", 'chevrotain']
                    }
                }
            },

            ecma5: {
                options: {
                    src:            'bin/examples/ecma5.js',
                    objectToExport: 'chevrotain.examples.ecma5',
                    template:       'scripts/umd.hbs',
                    deps:           {
                        'default': ['_', 'chevrotain'],
                        amd:       ['lodash', 'chevrotain'],
                        cjs:       ['lodash', '../chevrotain'],
                        global:    ['_', 'chevrotain']
                    }
                }
            }

        },

        clean:  {
            all: ["bin/"]
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
                    'bin/chevrotain.js':      ['bin/chevrotain.js'],
                    'bin/chevrotainSpecs.js': specsFiles.concat(exampleSpecsFiles)
                }
            },

            ecma5: {
                files: {
                    'bin/examples/ecma5.js': ecma5Includes
                }
            }
        },

        release: {
            options: {
                tagName:         'v<%=version%>',
                additionalFiles: ['bower.json'],
                github:          {
                    repo:        'SAP/chevrotain',
                    usernameVar: 'GITHUB_USERNAME', //ENVIRONMENT VARIABLE that contains Github username
                    passwordVar: 'GITHUB_PASSWORD' // ENVIRONMENT VARIABLE that contains Github password or token
                    // github token must be defined as an env parameter
                }
            }

        },

        compress: {
            github_release_zip: {
                options: {
                    archive: 'package/chevrotain-binaries-' + pkg.version + '.zip'
                },
                files:   [{src: githubReleaseFiles, dest: '/'}]
            },
            github_release_tgz: {
                options: {
                    archive: 'package/chevrotain-binaries-' + pkg.version + '.tar.gz'
                },
                files:   [{src: githubReleaseFiles, dest: '/'}]
            }
        }
    })

    grunt.loadNpmTasks('grunt-karma')
    grunt.loadNpmTasks('grunt-tslint')
    grunt.loadNpmTasks("grunt-ts")
    grunt.loadNpmTasks('grunt-umd')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-jasmine-node-coverage')
    grunt.loadNpmTasks('grunt-release')
    grunt.loadNpmTasks('grunt-contrib-compress');

    var releaseBuildTasks = [
        'clean:all',
        'ts:release',
        'ts:release_test_code',
        'tslint',
        'concat:release',
        'umd:release',
        'umd:release_specs',
        'compress'
    ]

    var commonReleaseTasks = releaseBuildTasks.concat(['jasmine_node:node_release_tests'])

    grunt.registerTask('build', releaseBuildTasks)
    grunt.registerTask('build_and_test', commonReleaseTasks)
    grunt.registerTask('test', ['jasmine_node:node_release_tests'])
    grunt.registerTask('build_and_test_plus_browsers', commonReleaseTasks.concat(['karma:tests_on_browsers']))

    grunt.registerTask('dev_build', [
        'clean:all',
        'ts:dev_build',
        'tslint',
        'karma:dev_build'])


    grunt.registerTask('ecma5', releaseBuildTasks.concat(['concat:ecma5', 'umd:ecma5']))

}