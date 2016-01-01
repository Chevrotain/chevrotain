var _ = require('lodash')
var specsFiles = require('./scripts/findSpecs')("bin/tsc/test/", "test")
var srcFiles = require('./scripts/findRefs')('build/chevrotain.ts')
var semver = require("semver")

var githubReleaseFiles = ['./package.json',
    './LICENSE.txt',
    "./bin/chevrotain.d.ts",
    "./bin/chevrotain.js",
    './readme.md',
    'bin/docs'
]

var INSTALL_LINK_TEST = 'npm install && npm link chevrotain && npm test'

// Integration tests using older versions of node.js will
// avoid running tests that require ES6 capabilities only aviliable in node.js >= 4
var nodejs_examples_test_command = semver.gte(process.version, "4.0.0") ?
    "mocha *spec.js" :
    "mocha *spec.js -i -g ES6"

module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')

    // this helps reduce mistakes caused by the interface between the screen and the chair :)
    var bower = grunt.file.readJSON('bower.json')
    if (pkg.dependencies.lodash !== bower.dependencies.lodash) {
        throw Error("mismatch in bower and npm lodash dependency version")
    }

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        run: {
            options:                        {
                failOnError: true
            },
            npm_link:                       {
                exec: 'npm link'
            },
            test_examples_nodejs:           {
                options: {
                    cwd: process.cwd() + "/examples/nodejs"
                },
                exec:    "npm install && npm link chevrotain && " + nodejs_examples_test_command
            },
            test_examples_lexer:            {
                options: {
                    cwd: process.cwd() + "/examples/lexer"
                },
                exec:    INSTALL_LINK_TEST
            },
            test_examples_jison_lex:        {
                options: {
                    cwd: process.cwd() + "/examples/jison_lex"
                },
                exec:    INSTALL_LINK_TEST
            },
            test_examples_typescript_ecma5: {
                options: {
                    cwd: process.cwd() + "/examples/typescript_ecma5"
                },
                exec:    INSTALL_LINK_TEST
            }
        },

        karma: {
            options: {
                configFile: 'karma.conf.js',
                singleRun:  true,
                browsers:   ['Chrome']
            },

            dev_build: {},

            browsers_tests: {
                options: {
                    files:    [
                        'bower_components/lodash/lodash.js',
                        'test.config.js',
                        'bin/chevrotain.js',
                        'bin/chevrotainSpecs.js'
                    ],
                    browsers: ['Chrome_travis_ci', "Firefox"]
                }
            },

            browsers_tests_requirejs: {
                options: {
                    frameworks: ["requirejs", 'mocha', 'chai'],

                    files:    [
                        {pattern: 'bower_components/lodash/lodash.js', included: false},
                        {pattern: 'bin/chevrotain.js', included: false},
                        {pattern: 'bin/chevrotainSpecs.js', included: false},
                        {pattern: 'bin/blahSpec.js', included: false},
                        'test.config.js',
                        'test/requirejs_test_main.js'
                    ],
                    browsers: ['Chrome_travis_ci', "Firefox"]
                }
            }
        },

        mocha_istanbul: {
            coverage: {
                src:     'bin/chevrotain.js',
                options: {
                    root:           './bin/',
                    mask:           '*tainSpecs.js',
                    coverageFolder: 'bin/coverage',
                    excludes:       ['*tainSpecs.js']
                }
            }
        },

        istanbul_check_coverage: {
            default: {
                options: {
                    coverageFolder: 'bin/coverage',
                    check:          {
                        statements: 100,
                        branches:   100,
                        lines:      100,
                        functions:  100
                    }
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },

            files: {
                src: ['src/**/*.ts', 'test/**/*.ts']
            }
        },

        ts: {
            options: {
                bin:  "ES5",
                fast: "never"

            },

            dev_build: {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!bin/**/*.ts", "!release/**/*.ts"],
                outDir: "bin/gen"
            },

            release: {
                src:     ['build/chevrotain.ts'],
                out:     'bin/chevrotain.js',
                options: {
                    removeComments: false,
                    sourceMap:      false // due to UMD and concat generated headers the original source map will be invalid.
                }
            },

            validate_definitions: {
                src:    ["bin/chevrotain.d.ts"],
                outDir: "bin/garbage"
            },

            // this is the same as the 'build' process, all .ts --> .js in gen directory
            // in a later step those files will be aggregated into separate components
            release_test_code: {
                src:     ["src/**/*.ts", "test/**/*.ts", "libs/**/*.ts"],
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
                        // dummy empty <''> to align arguments and parameters
                        // (sometimes two sometimes three depending on module loader)
                        amd:       ['lodash', '', 'chevrotain'],
                        cjs:       ['lodash', '../test.config.js', './chevrotain'],
                        global:    ['_', "undefined", 'chevrotain']
                    }
                }
            }
        },

        clean: {
            release: ['bin/*.*', 'bin/tsc', 'bin/docs'],
            dev:     ['bin/gen']
        },

        concat: {
            release:             {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                            '<%= grunt.template.today("yyyy-mm-dd") %> */\n',

                    process: function fixTSModulePatternForCoverage(src, filePath) {
                        // prefix (lang = chevrotain.lang || (chevrotain.lang = {}) with /* istanbul ignore next */
                        var fixed2PartsModules = src.replace(
                            /(\((\w+) = (\w+\.\2) \|\|) (\(\3 = \{}\)\))/g, "/* istanbul ignore next */ $1 /* istanbul ignore next */ $4")

                        var fixedAllModulesPattern = fixed2PartsModules.replace(
                            /(\(chevrotain \|\| \(chevrotain = \{}\)\);)/g, "/* istanbul ignore next */ $1")

                        var fixedTypeScriptExtends = fixedAllModulesPattern.replace("if (b.hasOwnProperty(p)) d[p] = b[p];",
                            "/* istanbul ignore next */ " + " if (b.hasOwnProperty(p)) d[p] = b[p];")

                        fixedTypeScriptExtends = fixedTypeScriptExtends.replace("d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());",
                            "/* istanbul ignore next */ " + " d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());")

                        // TODO: typescript compiler swallows comments in certain situations
                        //       once this is fixed the string replacements below can be removed.

                        // very little point in testing this, this is a pattern matching functionality missing in typescript/javascript
                        // if the code reaches that point it will go "boom" which is the purpose, the going boom part is not part
                        // of the contract, it just makes sure we fail fast if we supply invalid arguments.
                        var fixedNoneExhaustive = fixedTypeScriptExtends.replace(/(default\s*:\s*throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                            "/* istanbul ignore next */ $1")

                        fixedNoneExhaustive = fixedNoneExhaustive.replace(/(\s+)(else if \(.+\s+.+\s+.+\s+else \{\s+throw Error\("non exhaustive match"\))/g,
                            "/* istanbul ignore else */ $1$2")

                        fixedNoneExhaustive = fixedNoneExhaustive.replace(/(throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                            "/* istanbul ignore next */ $1")

                        return fixedNoneExhaustive
                    }
                },
                files:   {
                    'bin/chevrotain.js':      ['bin/chevrotain.js'],
                    'bin/chevrotainSpecs.js': specsFiles
                }
            },
            release_definitions: {
                options: {
                    banner:  '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                             '<%= grunt.template.today("yyyy-mm-dd") %> */\n' +
                             'declare module chevrotain {\n' +
                             '    module lang {\n' +
                             '        class HashTable<V>{}\n' +
                             '    }\n',
                    process: function removeOriginalHeaderAndFooter(src, filePath) {
                        var fixedModuleName, fixedIndentation
                        if (_.contains(filePath, 'gast_public')) {
                            fixedModuleName = src.replace('declare namespace chevrotain.gast {', '\nmodule gast {')
                            fixedIndentation = fixedModuleName.replace(/([\n\r]+\s*)/g, '$1\t')
                            return fixedIndentation
                        }
                        else if (_.contains(filePath, 'exceptions_public')) {
                            fixedModuleName = src.replace('declare namespace chevrotain.exceptions {', '\nmodule exceptions {')
                            fixedIndentation = fixedModuleName.replace(/([\n\r]+\s*)/g, '$1\t')
                            return fixedIndentation
                        }
                        var result = src.replace("declare namespace chevrotain {", "")
                        var lastRCurlyIdx = result.lastIndexOf("}")
                        result = result.substring(0, lastRCurlyIdx)
                        result = _.trimRight(result)
                        return result
                    },

                    footer: '\n}'
                },
                files:   {
                    'bin/chevrotain.d.ts': [
                        'bin/tsc/src/scan/tokens_public.d.ts',
                        'bin/tsc/src/scan/lexer_public.d.ts',
                        'bin/tsc/src/parse/parser_public.d.ts',
                        'bin/tsc/src/parse/exceptions_public.d.ts',
                        'bin/tsc/src/parse/grammar/gast_public.d.ts']
                }
            }
        },

        typedoc: {
            build_docs: {
                options: {
                    mode:             'file',
                    target:           'es5',
                    out:              'bin/docs',
                    name:             'Chevrotain',
                    excludeExternals: '',
                    // see: https://github.com/sebastian-lenz/typedoc/issues/73
                    // double negative for the win!
                    externalPattern:  '!**/*public**'
                },
                // must include all the files explicitly instead of just targeting build/chevrotain.ts
                // otherwise the include(exclude !...) won't work
                src:     srcFiles
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
        },

        coveralls: {
            publish: {
                src: 'bin/coverage/lcov.info'
            }
        }
    })

    require('load-grunt-tasks')(grunt);

    var buildTasks = [
        'clean:release',
        'ts:release',
        'ts:release_test_code',
        'tslint',
        'concat:release',
        'concat:release_definitions',
        'ts:validate_definitions',
        'umd:release',
        'umd:release_specs',
        'typedoc:build_docs',
        'compress'
    ]

    var unitTestsTasks = [
        'mocha_istanbul',
        'istanbul_check_coverage'
    ]

    var integrationTestsTasks = [
        'run:npm_link',
        'run:test_examples_nodejs',
        'run:test_examples_lexer',
        'run:test_examples_jison_lex',
        'run:test_examples_typescript_ecma5'
    ]

    var browserUnitTests = [
        "karma:browsers_tests",
        "karma:browsers_tests_requirejs"
    ]

    var buildTestTasks = buildTasks.concat(unitTestsTasks)

    grunt.registerTask('build', buildTasks)
    grunt.registerTask('build_test', buildTestTasks)
    grunt.registerTask('unit_tests', unitTestsTasks)
    grunt.registerTask('integration_tests', integrationTestsTasks)
    grunt.registerTask('browsers_unit_tests', browserUnitTests)

    grunt.registerTask('dev_build_test', [
        'clean:dev',
        'ts:dev_build',
        'tslint',
        'karma:dev_build'])
}
