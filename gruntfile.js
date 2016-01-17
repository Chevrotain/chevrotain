var _ = require('lodash')
var semver = require("semver")
var webpack = require("webpack")

var githubReleaseFiles = ['./package.json',
    './LICENSE.txt',
    "./bin/chevrotain.d.ts",
    "./bin/chevrotain.js",
    "./bin/chevrotain.min.js",
    './readme.md',
    'bin/docs/**/*'
]

var PUBLIC_API_DTS_FILES = [
    'bin/src/scan/tokens_public.d.ts',
    'bin/src/scan/lexer_public.d.ts',
    'bin/src/parse/parser_public.d.ts',
    'bin/src/parse/exceptions_public.d.ts',
    'bin/src/parse/grammar/gast_public.d.ts',
    'bin/src/parse/cache_public.d.ts'
]


var PUBLIC_API_TS_FILES = _.map(PUBLIC_API_DTS_FILES, function(binDefFile) {
    return binDefFile.replace("bin/", "").replace(".d", "")
})
// so typedoc can compile "module.exports" in cache_public
PUBLIC_API_TS_FILES.push("src/env.d.ts")

var INSTALL_LINK_TEST = 'npm install && npm link chevrotain && npm test'

var fourSpaces = "    "

// Integration tests using older versions of node.js will
// avoid running tests that require ES6 capabilities only aviliable in node.js >= 4
var nodejs_examples_test_command = semver.gte(process.version, "4.0.0") ?
    "mocha *spec.js" :
    "mocha *spec.js -i -g ES6"

var banner = '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-mm-dd") %> */\n'

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
                browsers:   ['Chrome_travis_ci', "Firefox"],
                // may help with strange failures on travis-ci "some of your tests did a full page reload"
                concurrency: 1
            },

            browsers_unit_tests: {
                options: {
                    files: [
                        'test/test.config.js',
                        'bin/chevrotainSpecs.js'
                    ]
                }
            },

            browsers_unit_tests_minified: {
                options: {
                    files: [
                        'test/test.config.js',
                        'bin/chevrotainSpecs.min.js'
                    ]
                }
            },

            browsers_tests_local: {
                options: {
                    browsers: ['Chrome', "Firefox", "IE"],

                    files: [
                        'test/test.config.js',
                        'bin/chevrotainSpecs.js'
                    ]
                }
            },

            browsers_integration_tests_globals: {
                options: {
                    files: [
                        'bin/chevrotain.js',
                        'test/test.config.js',
                        'test_integration/**/*spec.js'
                    ]
                }
            },

            browsers_integration_tests_amd: {
                options: {
                    frameworks: ["requirejs", 'mocha', 'chai'],
                    files:      [
                        'bin/chevrotain.js',
                        'test/test.config.js',
                        {pattern: 'test_integration/*/*.js', included: false},
                        'test_integration/integration_tests_main.js'
                    ]
                }
            },

            browsers_integration_tests_globals_minified: {
                options: {
                    files: [
                        'bin/chevrotain.min.js',
                        'test/test.config.js',
                        'test_integration/**/*spec.js'
                    ]
                }
            },

            browsers_integration_tests_amd_minified: {
                options: {
                    frameworks: ["requirejs", 'mocha', 'chai'],
                    files:      [
                        'bin/chevrotain.min.js',
                        'test/test.config.js',
                        {pattern: 'test_integration/*/*.js', included: false},
                        'test_integration/integration_tests_main.js'
                    ]
                }
            }
        },

        mocha_istanbul: {
            coverage: {
                src:     'bin/test',
                options: {
                    mask:           '**/*spec.js',
                    coverageFolder: 'bin/coverage'
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
                target:    "ES5",
                fast:      "never",
                sourceMap: false

            },

            release: {
                src:     ["src/**/*.ts", "test/**/*.ts", "libs/**/*.ts"],
                outDir:  'bin',
                options: {
                    module:         "commonjs",
                    declaration:    true,
                    removeComments: false
                }
            },

            validate_definitions: {
                src:     ["test_integration/definitions/es6_modules.ts"],
                outDir:  "bin/garbage",
                options: {
                    module: "commonjs"
                }
            },

            // the created d.ts should work with both Typescript projects using ES6
            // modules syntax or those using the old namespace syntax.
            validate_definitions_namespace: {
                src:    ["test_integration/definitions/namespaces.ts"],
                outDir: "bin/garbage"
            }
        },

        clean: {
            release: ['bin/*.*', 'bin/tsc', 'bin/docs'],
            dev:     ['bin/gen']
        },

        "string-replace": {
            coverage_ignore: {
                files:   {
                    'bin/src/': 'bin/src/**'
                },
                options: {
                    replacements: [{
                        pattern:     'if (b.hasOwnProperty(p)) d[p] = b[p];',
                        replacement: '/* istanbul ignore next */ ' + ' if (b.hasOwnProperty(p)) d[p] = b[p];'
                    }, {
                        pattern:     'd.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());',
                        replacement: '/* istanbul ignore next */ ' + ' d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());'
                    }, {
                        pattern:     /(\s+)(else if \(.+\s+.+\s+.+\s+else \{\s+throw Error\("non exhaustive match"\))/g,
                        replacement: '/* istanbul ignore else */ $1$2'
                    }, {
                        pattern:     /(throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                        replacement: '/* istanbul ignore next */ $1'
                    }]
                }
            }
        },

        concat: {
            release_definitions: {
                options: {
                    // TODO: seems like the HashTable class may need to be included in the public API
                    banner: banner +
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
                    'bin/chevrotain.d.ts': PUBLIC_API_DTS_FILES
                }
            }
        },

        typedoc: {
            build_docs: {
                options: {
                    mode:             'file',
                    target:           'es5',
                    out:              'bin/docs',
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
                entry:  "./bin/src/api.js",
                output: {
                    path:           "bin/",
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
                entry:  "./bin/test/all.js",
                output: {
                    path:     "bin/",
                    filename: "chevrotainSpecs.js"
                }
            },

            release_uglify: {
                entry:  "./bin/src/api.js",
                output: {
                    path:           "bin/",
                    filename:       "chevrotain.min.js",
                    library:        "chevrotain",
                    libraryTarget:  "umd",
                    umdNamedDefine: true
                },

                plugins: [
                    new webpack.BannerPlugin(banner, {raw: true}),
                    new webpack.optimize.UglifyJsPlugin({
                        // not using name mangling because it may break usage of Function.name (functionName utility)
                        mangle: false
                    })
                ]
            },

            specs_uglify: {
                entry:  "./bin/test/all.js",
                output: {
                    path:     "bin/",
                    filename: "chevrotainSpecs.min.js"
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
        },

        coveralls: {
            publish: {
                src: 'bin/coverage/lcov.info'
            }
        },

        uglify: {
            options: {
                // not using name mangling because it may break usage of Function.name (functionName utility)
                mangle: false
            },
            release: {
                options: {
                    banner: banner
                },
                files:   {
                    'bin/chevrotain.min.js': ['bin/chevrotain.js']
                }
            },
            specs:   {
                files: {
                    'bin/chevrotainSpecs.min.js': ['bin/chevrotainSpecs.js']
                }
            }
        }
    })

    require('load-grunt-tasks')(grunt);

    var buildTasks = [
        'clean:release',
        'tslint',
        'ts:release',
        'string-replace:coverage_ignore',
        'concat:release_definitions',
        'ts:validate_definitions',
        'ts:validate_definitions_namespace',
        'webpack:release',
        'webpack:specs',
        'webpack:release_uglify',
        'webpack:specs_uglify',
        'typedoc:build_docs',
        'compress'
    ]

    var unitTestsTasks = [
        'mocha_istanbul',
        'istanbul_check_coverage'
    ]

    var integrationTestsNodeTasks = [
        'run:npm_link',
        'run:test_examples_nodejs',
        'run:test_examples_lexer',
        'run:test_examples_jison_lex',
        'run:test_examples_typescript_ecma5'
    ]

    var browserUnitTests = [
        'karma:browsers_unit_tests',
        'karma:browsers_unit_tests_minified'
    ]

    var browserIntegrationTests = [
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
    grunt.registerTask('browsers_unit_tests', browserUnitTests)
    grunt.registerTask('browsers_integration_tests', browserIntegrationTests)

}
