var _ = require('lodash')
var semver = require("semver")
var webpack = require("webpack")

var PUBLIC_API_DTS_FILES = [
    'lib/src/scan/tokens_public.d.ts',
    'lib/src/scan/lexer_public.d.ts',
    'lib/src/parse/parser_public.d.ts',
    'lib/src/parse/exceptions_public.d.ts',
    'lib/src/parse/grammar/path_public.d.ts',
    'lib/src/parse/grammar/gast_public.d.ts',
    'lib/src/parse/cache_public.d.ts'
]

var PUBLIC_API_TS_FILES = _.map(PUBLIC_API_DTS_FILES, function(binDefFile) {
    return binDefFile.replace("lib/", "").replace(".d", "")
})
// so typedoc can compile "module.exports" in cache_public
PUBLIC_API_TS_FILES.push("src/env.d.ts")

var fourSpaces = "    "

// Integration tests using older versions of node.js will
// avoid running tests that require ES6 capabilities only available in node.js >= 4
var examples_test_command = semver.gte(process.version, "4.0.0") ?
    "mocha **/*spec.js" :
    "mocha **/*spec.js -i -g ES6"

var INSTALL_LINK = 'npm install && npm link chevrotain'
var INSTALL_LINK_TEST = INSTALL_LINK + ' && ' + examples_test_command

var banner = '/*! <%= pkg.name %> - v<%= pkg.version %> */'

module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        run: {
            options:                {
                failOnError: true
            },
            npm_link:               {
                exec: 'npm link'
            },
            test_examples_lexer:    {
                options: {
                    cwd: process.cwd() + "/examples/lexer"
                },
                exec:    INSTALL_LINK_TEST
            },
            test_examples_grammars: {
                options: {
                    cwd: process.cwd() + "/examples/grammars"
                },
                exec:    INSTALL_LINK_TEST
            },
            test_examples_parser:   {
                options: {
                    cwd: process.cwd() + "/examples/parser"
                },
                exec:    INSTALL_LINK + ' && ' + 'grunt --gruntfile minification/gruntfile.js' + ' && ' + examples_test_command
            },

            test_examples_lang_services: {
                options: {
                    cwd: process.cwd() + "/examples/language_services"
                },
                exec:    INSTALL_LINK + "&& grunt test"
            }
        },

        karma: {
            options: {
                configFile: 'karma_sauce.conf.js',
                singleRun:  true,
                client:     {
                    captureConsole: true
                }
            },

            browsers_unit_tests: {
                options: {
                    port:  9980,
                    files: [
                        'test/test.config.js',
                        'lib/chevrotainSpecs.js'
                    ]
                }
            },

            browsers_integration_tests_globals: {
                options: {
                    port:  9982,
                    files: [
                        'lib/chevrotain.js',
                        'test/test.config.js',
                        'test_integration/**/*spec.js'
                    ]
                }
            },

            browsers_integration_tests_amd: {
                options: {
                    port:       9983,
                    frameworks: ["requirejs", 'mocha', 'chai'],
                    files:      [
                        'lib/chevrotain.js',
                        'test/test.config.js',
                        {pattern: 'test_integration/*/*.js', included: false},
                        'test_integration/integration_tests_main.js'
                    ]
                }
            },

            browsers_integration_tests_globals_minified: {
                options: {
                    port:  9984,
                    files: [
                        'lib/chevrotain.min.js',
                        'test/test.config.js',
                        'test_integration/**/*spec.js'
                    ]
                }
            },

            browsers_integration_tests_amd_minified: {
                options: {
                    port:       9985,
                    frameworks: ["requirejs", 'mocha', 'chai'],
                    files:      [
                        'lib/chevrotain.min.js',
                        'test/test.config.js',
                        {pattern: 'test_integration/*/*.js', included: false},
                        'test_integration/integration_tests_main.js'
                    ]
                }
            }
        },

        mocha_istanbul: {
            coverage: {
                src:     'lib/test',
                options: {
                    mask:           '**/*spec.js',
                    coverageFolder: 'dev/coverage'
                }
            }
        },

        istanbul_check_coverage: {
            default: {
                options: {
                    coverageFolder: 'dev/coverage',
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
                target:    "ES5",
                fast:      "never",
                sourceMap: false

            },

            release: {
                src:     ["src/**/*.ts", "test/**/*.ts", "libs/**/*.ts"],
                outDir:  'lib',
                options: {
                    module:         "commonjs",
                    declaration:    true,
                    removeComments: false
                }
            },

            validate_definitions: {
                src:     ["test_integration/definitions/es6_modules.ts"],
                outDir:  "dev/garbage",
                options: {
                    module: "commonjs"
                }
            },

            // the created d.ts should work with both Typescript projects using ES6
            // modules syntax or those using the old namespace syntax.
            validate_definitions_namespace: {
                src:    ["test_integration/definitions/namespaces.ts"],
                outDir: "dev/garbage"
            }
        },

        clean: {
            release: ['lib/**/*', 'dev/**/*']
        },

        replace: {
            coverage_ignore: {
                src:          ['lib/src/**/*.js'],
                overwrite:    true,
                replacements: [{
                    from: 'if (b.hasOwnProperty(p)) d[p] = b[p];',
                    to:   '/* istanbul ignore next */ ' + ' if (b.hasOwnProperty(p)) d[p] = b[p];'
                }, {
                    from: 'd.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());',
                    to:   '/* istanbul ignore next */ ' + ' d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());'
                }, {
                    from: /(\s+)(else if \(.+\s+.+\s+.+\s+(?:.+\s+)?else \{\s+throw Error\("non exhaustive match"\))/g,
                    to:   '/* istanbul ignore else */ $1$2'
                }, {
                    from: /(throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                    to:   '/* istanbul ignore next */ $1'
                }]
            }
        },

        concat: {
            release_definitions: {
                options: {
                    // TODO: seems like the HashTable class may need to be included in the public API
                    banner: banner + '\n' +
                            'declare namespace chevrotain {\n' +
                            '    class HashTable<V>{}\n    ',

                    process: function processDefinitions(src, filePath) {
                        var withOutImports = src.replace(/import.*;(\n|\r\n)/g, '')
                        // TODO: investigate why do Typescript definition files include private members.
                        var withoutPrivate = withOutImports.replace(/private.*;(\n|\r\n)/g, '')

                        // need to remove inner declares as we are wrapping in a namespace
                        var withoutDeclare = withoutPrivate.replace(/declare /g, '')
                        var fixedInnerIdent = withoutDeclare.replace(/(\r\n|\n)/g, grunt.util.linefeed + fourSpaces)
                        return fixedInnerIdent
                    },

                    // this syntax allows usage of chevrotain.d.ts from either
                    // ES6 modules / older namespaces style in typescript.
                    footer: '\n}\n\n' +
                            'declare module "chevrotain" {\n' +
                            '    export = chevrotain;\n' +
                            '}\n',

                    // extra spaces needed to fix indentation.
                    separator: grunt.util.linefeed + fourSpaces
                },
                files:   {
                    'lib/chevrotain.d.ts': PUBLIC_API_DTS_FILES
                }
            }
        },

        typedoc: {
            build_docs: {
                options: {
                    mode:             'file',
                    target:           'es5',
                    out:              'dev/docs',
                    module:           'commonjs',
                    name:             'Chevrotain',
                    excludeExternals: ''
                },
                src:     PUBLIC_API_TS_FILES
            }
        },

        webpack: {
            options: {
                stats:       {
                    colors:  true,
                    modules: true,
                    reasons: true
                },
                failOnError: true
            },

            release: {
                entry:  "./lib/src/api.js",
                output: {
                    path:           "lib/",
                    filename:       "chevrotain.js",
                    library:        "chevrotain",
                    libraryTarget:  "umd",
                    umdNamedDefine: true
                },

                plugins: [
                    new webpack.BannerPlugin(banner, {raw: true})
                ]
            },

            specs: {
                entry:  "./lib/test/all.js",
                output: {
                    path:     "lib/",
                    filename: "chevrotainSpecs.js"
                }
            },

            release_uglify: {
                entry:  "./lib/src/api.js",
                output: {
                    path:           "lib/",
                    filename:       "chevrotain.min.js",
                    library:        "chevrotain",
                    libraryTarget:  "umd",
                    umdNamedDefine: true
                },

                plugins: [
                    new webpack.BannerPlugin(banner, {raw: true}),
                    new webpack.optimize.UglifyJsPlugin()
                ]
            },
        },

        coveralls: {
            publish: {
                src: 'dev/coverage/lcov.info'
            }
        },
    })

    require('load-grunt-tasks')(grunt)

    var buildTasks = [
        'clean:release',
        'tslint',
        'ts:release',
        'replace:coverage_ignore',
        'concat:release_definitions',
        'ts:validate_definitions',
        'ts:validate_definitions_namespace',
        'webpack:release',
        'webpack:specs',
        'webpack:release_uglify',
        'typedoc:build_docs'
    ]

    var unitTestsTasks = [
        'mocha_istanbul'
    ]

    if (!process.env.TRAVIS || // always run coverage checks locally
        process.env.COVERAGE) { // Flag to enable coverage checks on CI Voter.
        unitTestsTasks.push('istanbul_check_coverage')
    }

    var integrationTestsNodeTasks = [
        'run:npm_link',
        'run:test_examples_grammars',
        'run:test_examples_parser',
        'run:test_examples_lexer',
        'run:test_examples_lang_services'
    ]

    var browsers_tests = [
        'karma:browsers_unit_tests',
        'karma:browsers_integration_tests_globals',
        'karma:browsers_integration_tests_globals_minified',
        'karma:browsers_integration_tests_amd',
        'karma:browsers_integration_tests_amd_minified'
    ]

    if (process.env.TRAVIS_PULL_REQUEST) {
        browsers_tests = function() {
            console.log("Skipping browser tests due to running in a pull request env without the SauceLabs credentials\n"
            )
        }
    }

    if (process.env.TRAVIS_BRANCH !== "master") {
        browsers_tests = function() {
            console.log("Skipping browser tests as they should only run on the 'master' branch\n" +
            "As there seems to be issues enabling tags and result filtering with the karma-sauce-labs-launcher")
        }
    }

    var buildTestTasks = buildTasks.concat(unitTestsTasks)

    grunt.registerTask('build', buildTasks)
    grunt.registerTask('build_test', buildTestTasks)
    grunt.registerTask('unit_tests', unitTestsTasks)
    grunt.registerTask('node_integration_tests', integrationTestsNodeTasks)
    grunt.registerTask('browsers_tests', browsers_tests)
}
