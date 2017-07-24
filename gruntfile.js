var _ = require("lodash")
var webpack = require("webpack")
var path = require("path")

// TODO: write these files to tsdocsconfig.json
var PUBLIC_API_DTS_FILES = [
    "lib/src/scan/tokens_public.d.ts",
    "lib/src/scan/lexer_public.d.ts",
    "lib/src/parse/parser_public.d.ts",
    "lib/src/parse/cst/cst_public.d.ts",
    "lib/src/parse/errors_public.d.ts",
    "lib/src/parse/exceptions_public.d.ts",
    "lib/src/parse/grammar/path_public.d.ts",
    "lib/src/parse/grammar/gast_public.d.ts",
    "lib/src/parse/cache_public.d.ts"
]

var PUBLIC_API_TS_FILES = _.map(PUBLIC_API_DTS_FILES, function(binDefFile) {
    return binDefFile.replace("lib/", "").replace(".d", "")
})

// so typedoc can compile "module.exports" in cache_public
PUBLIC_API_TS_FILES.push("./node_modules/@types/node/index.d.ts")

var fourSpaces = "    "
var examples_test_command =
    "./node_modules/.bin/mocha '!(node_modules)/**/*spec.js'"

var INSTALL_LINK = "npm install && npm link chevrotain"
var INSTALL_LINK_TEST = INSTALL_LINK + " && " + examples_test_command

var banner = "/*! <%= pkg.name %> - v<%= pkg.version %> */"

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON("package.json")

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        run: {
            options: {
                failOnError: true
            },

            ts_compile: {
                exec: "npm run compile"
            },
            ts_compile_defs: {
                exec: "npm run compile_definitions"
            },
            ts_compile_defs_namespace: {
                exec: "npm run compile_definitions_namespace"
            },
            npm_link: {
                exec: "npm link"
            },
            lint: {
                exec: "npm run lint"
            },
            verify_format: {
                exec: "npm run verify_format"
            },
            test_examples_lexer: {
                options: {
                    cwd: process.cwd() + "/examples/lexer/"
                },
                exec: INSTALL_LINK_TEST
            },
            test_examples_grammars: {
                options: {
                    cwd: process.cwd() + "/examples/grammars/"
                },
                exec: INSTALL_LINK_TEST
            },
            test_examples_parser: {
                options: {
                    cwd: process.cwd() + "/examples/parser/"
                },
                exec:
                    INSTALL_LINK +
                    " && " +
                    "grunt --gruntfile minification/gruntfile.js" +
                    " && " +
                    "npm --prefix ./webpack" +
                    " install  ./webpack" +
                    " && " +
                    examples_test_command
            },
            test_examples_implementation_languages: {
                options: {
                    cwd: process.cwd() + "/examples/implementation_languages/"
                },
                exec: INSTALL_LINK + " && npm test"
            },
            test_tutorial: {
                options: {
                    cwd: process.cwd() + "/docs/tutorial/src/"
                },
                exec: INSTALL_LINK + " && npm test"
            },
            bundle: {
                exec: "npm run bundle"
            },
            bundle_min: {
                exec: "npm run bundle_min"
            },
            bundle_spec: {
                exec: "npm run bundle_spec"
            },

            docs: {
                exec: "npm run docs"
            }
        },

        karma: {
            options: {
                configFile: "karma_sauce.conf.js",
                singleRun: true,
                client: {
                    captureConsole: true
                }
            },

            browsers_unit_tests: {
                options: {
                    port: 9980,
                    files: ["test/test.config.js", "lib/chevrotainSpecs.js"]
                }
            },

            browsers_integration_tests_globals: {
                options: {
                    port: 9982,
                    files: [
                        "lib/chevrotain.js",
                        "test/test.config.js",
                        "test_integration/**/*spec.js"
                    ]
                }
            },

            browsers_integration_tests_amd: {
                options: {
                    port: 9983,
                    frameworks: ["requirejs", "mocha", "chai"],
                    files: [
                        "lib/chevrotain.js",
                        "test/test.config.js",
                        { pattern: "test_integration/*/*.js", included: false },
                        "test_integration/integration_tests_main.js"
                    ]
                }
            },

            browsers_integration_tests_globals_minified: {
                options: {
                    port: 9984,
                    files: [
                        "lib/chevrotain.min.js",
                        "test/test.config.js",
                        "test_integration/**/*spec.js"
                    ]
                }
            },

            browsers_integration_tests_amd_minified: {
                options: {
                    port: 9985,
                    frameworks: ["requirejs", "mocha", "chai"],
                    files: [
                        "lib/chevrotain.min.js",
                        "test/test.config.js",
                        { pattern: "test_integration/*/*.js", included: false },
                        "test_integration/integration_tests_main.js"
                    ]
                }
            }
        },

        mocha_istanbul: {
            coverage: {
                src: "lib/test",
                options: {
                    mask: "**/*spec.js",
                    coverageFolder: "dev/coverage"
                }
            }
        },

        istanbul_check_coverage: {
            default: {
                options: {
                    coverageFolder: "dev/coverage",
                    check: {
                        statements: 100,
                        branches: 100,
                        lines: 100,
                        functions: 100
                    }
                }
            }
        },

        clean: {
            release: ["lib/**/*", "dev/**/*"]
        },

        // TODO: this is quite slow, need to examine if it is still needed...
        replace: {
            coverage_ignore: {
                // d.prototype = b === null ? Object.create(b) :
                src: ["lib/src/**/*.js"],
                overwrite: true,
                replacements: [
                    {
                        from: "if (b.hasOwnProperty(p)) d[p] = b[p];",
                        to:
                            "/* istanbul ignore next */ " +
                            " if (b.hasOwnProperty(p)) d[p] = b[p];"
                    },
                    {
                        from: "var extendStatics = Object.setPrototypeOf ||",
                        to:
                            "/* istanbul ignore next */ \n" +
                            "var extendStatics = Object.setPrototypeOf ||"
                    },
                    {
                        from: "d.prototype = b === null ? Object.create(b) :",
                        to:
                            "/* istanbul ignore next */ \n" +
                            "d.prototype = b === null ? Object.create(b) :"
                    },
                    {
                        from: /(\s+)(else if \(.+\s+.+\s+.+\s+(?:.+\s+)?else \{\s+throw Error\("non exhaustive match"\))/g,
                        to: "/* istanbul ignore else */ $1$2"
                    },
                    {
                        from: /(throw\s*Error\s*\(\s*["']non exhaustive match["']\s*\))/g,
                        to: "/* istanbul ignore next */ $1"
                    },
                    {
                        from: /(\s+)(else if \(.+\s+.+\s+.+\s+(?:.+\s+)?)(\s*\/\/ IGNORE ABOVE ELSE)/g,
                        to: "/* istanbul ignore else */ $1$2"
                    },
                    {
                        from: /(_super.(?:apply|call)\(this, .+\)) (\|\| this;)/g,
                        to: "$1 /* istanbul ignore next */ $2"
                    }
                ]
            }
        },

        concat: {
            release_definitions: {
                options: {
                    // TODO: seems like the HashTable class may need to be included in the public API
                    banner:
                        banner +
                        "\n" +
                        "export as namespace chevrotain;\n" +
                        "declare class HashTable<V>{}\n",

                    process: function processDefinitions(src, filePath) {
                        var withOutImports = src.replace(
                            /import.*;(\n|\r\n)/g,
                            ""
                        )
                        // TODO: investigate why do Typescript definition files include private members.
                        var withoutPrivate = withOutImports.replace(
                            /private.*;(\n|\r\n)/g,
                            ""
                        )

                        return withoutPrivate
                    },

                    // extra spaces needed to fix indentation.
                    separator: grunt.util.linefeed + fourSpaces
                },
                files: {
                    "lib/chevrotain.d.ts": PUBLIC_API_DTS_FILES
                }
            }
        },

        coveralls: {
            publish: {
                src: "dev/coverage/lcov.info"
            }
        }
    })

    require("load-grunt-tasks")(grunt)

    var buildTasks = [
        "clean:release",
        "run:lint",
        "run:verify_format",
        "run:ts_compile",
        "replace:coverage_ignore",
        "concat:release_definitions",
        "run:ts_compile_defs",
        "run:ts_compile_defs_namespace",
        "run:bundle",
        "run:bundle_min",
        "run:bundle_spec",
        "run:docs"
    ]

    var quickBuildTasks = ["clean:release", "run:ts_compile", "run:bundle"]

    var unitTestsTasks = ["mocha_istanbul"]

    if (
        !process.env.TRAVIS || // always run coverage checks locally
        process.env.COVERAGE
    ) {
        // Flag to enable coverage checks on CI Voter.
        unitTestsTasks.push("istanbul_check_coverage")
    }

    var integrationTestsNodeTasks = [
        "run:npm_link",
        "run:test_examples_grammars",
        "run:test_examples_parser",
        "run:test_examples_lexer",
        "run:test_examples_implementation_languages",
        "run:test_tutorial"
    ]

    var browsers_tests = [
        "karma:browsers_unit_tests",
        "karma:browsers_integration_tests_globals",
        "karma:browsers_integration_tests_globals_minified",
        "karma:browsers_integration_tests_amd",
        "karma:browsers_integration_tests_amd_minified"
    ]

    if (process.env.TRAVIS_PULL_REQUEST !== "false") {
        browsers_tests = function() {
            console.log(
                "Skipping browser tests due to running in a pull request env without the SauceLabs credentials\n"
            )
        }
    }

    if (process.env.TRAVIS_BRANCH !== "master") {
        browsers_tests = function() {
            console.log(
                "Skipping browser tests as they should only run on the 'master' branch\n" +
                    "As there seems to be issues enabling tags and result filtering with the karma-sauce-labs-launcher"
            )
        }
    }

    var buildTestTasks = buildTasks.concat(unitTestsTasks)

    grunt.registerTask("build", buildTasks)
    grunt.registerTask("quick_build", quickBuildTasks)
    grunt.registerTask("build_test", buildTestTasks)
    grunt.registerTask("unit_tests", unitTestsTasks)
    grunt.registerTask("node_integration_tests", integrationTestsNodeTasks)
    grunt.registerTask("browsers_tests", browsers_tests)
}
