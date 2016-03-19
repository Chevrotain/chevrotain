var _ = require('lodash')
var semver = require("semver")
var webpack = require("webpack")

var PUBLIC_API_DTS_FILES = [
    'lib/src/scan/tokens_public.d.ts',
    'lib/src/scan/lexer_public.d.ts',
    'lib/src/parse/parser_public.d.ts',
    'lib/src/parse/exceptions_public.d.ts',
    'lib/src/parse/grammar/gast_public.d.ts',
    'lib/src/parse/cache_public.d.ts'
]

var PUBLIC_API_TS_FILES = _.map(PUBLIC_API_DTS_FILES, function(binDefFile) {
    return binDefFile.replace("lib/", "").replace(".d", "")
})
// so typedoc can compile "module.exports" in cache_public
PUBLIC_API_TS_FILES.push("src/env.d.ts")

var INSTALL_LINK_TEST = 'npm install && npm link chevrotain && npm test'

var fourSpaces = "    "

// Integration tests using older versions of node.js will
// avoid running tests that require ES6 capabilities only available in node.js >= 4
var nodejs_examples_test_command = semver.gte(process.version, "4.0.0") ?
    "mocha *spec.js" :
    "mocha *spec.js -i -g ES6"

var banner = '/*! <%= pkg.name %> - v<%= pkg.version %> */'

var browsers = []

if (process.env.BROWSER) {
    console.log("using karma browser config from env (travis-ci build)")
    browsers.push(process.env.BROWSER)
}
else {
    console.log("using default karma browser config from env (local testing)")
    browsers = ['Chrome_travis_ci', "Firefox"]
}

module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')

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
            test_examples_custom_lookahead: {
                options: {
                    cwd: process.cwd() + "/examples/custom_lookahead"
                },
                exec:    INSTALL_LINK_TEST
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
                configFile:  'karma.conf.js',
                singleRun:   true,
                browsers:    browsers,
                // may help with strange failures on travis-ci "some of your tests did a full page reload"
                concurrency: 1,
                client:      {
                    captureConsole: true
                },
                retryLimit:  3
            },

            browsers_unit_tests: {
                options: {
                    port:  9980,
                    files: [
                        'test/test.config.js',
                        'dev/chevrotainSpecs.js'
                    ]
                }
            },

            browsers_unit_tests_minified: {
                options: {
                    port:  9981,
                    files: [
                        'test/test.config.js',
                        'dev/chevrotainSpecs.min.js'
                    ]
                }
            },

            browsers_tests_local: {
                options: {
                    browsers: ['Chrome', "Firefox", "IE"],

                    files: [
                        'test/test.config.js',
                        'dev/chevrotainSpecs.js'
                    ]
                }
            },

            browsers_integration_tests_globals: {
                options: {
                    port:  9982,
                    files: [
                        'dev/chevrotain.js',
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
                        'dev/chevrotain.js',
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
                        'dev/chevrotain.min.js',
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
                        'dev/chevrotain.min.js',
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
            release: ['lib/src/**/*', 'lib/test/**/*', 'dev/**/*']
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
                    from: /(\s+)(else if \(.+\s+.+\s+.+\s+else \{\s+throw Error\("non exhaustive match"\))/g,
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
                    'dev/chevrotain.d.ts': PUBLIC_API_DTS_FILES
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
                    path:           "dev/",
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
                    path:     "dev/",
                    filename: "chevrotainSpecs.js"
                }
            },

            release_uglify: {
                entry:  "./lib/src/api.js",
                output: {
                    path:           "dev/",
                    filename:       "chevrotain.min.js",
                    library:        "chevrotain",
                    libraryTarget:  "umd",
                    umdNamedDefine: true
                },

                plugins: [
                    new webpack.BannerPlugin(banner, {raw: true}),
                    new webpack.optimize.UglifyJsPlugin({
                        mangle: {
                            // because chevrotain relies on Function.name
                            keep_fnames: true
                        }
                    })
                ]
            },

            specs_uglify: {
                entry:  "./lib/test/all.js",
                output: {
                    path:     "dev/",
                    filename: "chevrotainSpecs.min.js"
                }
            }
        },

        coveralls: {
            publish: {
                src: 'dev/coverage/lcov.info'
            }
        }
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
        'webpack:specs_uglify',
        'typedoc:build_docs'
    ]

    grunt.registerTask('verify_aggregated_files', function() {
        require("./scripts/release_validations").verifyAggregatedReleaseFile()
    })

    if (process.env.TRAVIS_TAG && process.env.DEPLOY) {
        buildTasks.push("verify_aggregated_files")
    }

    var unitTestsTasks = [
        'mocha_istanbul',
        'istanbul_check_coverage'
    ]

    var integrationTestsNodeTasks = [
        'run:npm_link',
        'run:test_examples_custom_lookahead',
        'run:test_examples_nodejs',
        'run:test_examples_lexer',
        'run:test_examples_jison_lex',
        'run:test_examples_typescript_ecma5'
    ]

    var browsers_tests = [
        'karma:browsers_unit_tests',
        'karma:browsers_unit_tests_minified',
        'karma:browsers_integration_tests_globals',
        'karma:browsers_integration_tests_globals_minified',
        'karma:browsers_integration_tests_amd',
        'karma:browsers_integration_tests_amd_minified'
    ]

    var buildTestTasks = buildTasks.concat(unitTestsTasks)

    grunt.registerTask('build', buildTasks)
    grunt.registerTask('build_test', buildTestTasks)
    grunt.registerTask('unit_tests', unitTestsTasks)
    grunt.registerTask('node_integration_tests', integrationTestsNodeTasks)
    grunt.registerTask('browsers_tests', browsers_tests)
}
