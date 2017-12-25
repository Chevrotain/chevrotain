const _ = require("lodash")

const PUBLIC_API_DTS_FILES = [
    "lib/src/scan/tokens_public.d.ts",
    "lib/src/scan/lexer_public.d.ts",
    "lib/src/parse/parser_public.d.ts",
    "lib/src/parse/cst/cst_public.d.ts",
    "lib/src/parse/errors_public.d.ts",
    "lib/src/parse/exceptions_public.d.ts",
    "lib/src/parse/grammar/path_public.d.ts",
    "lib/src/parse/grammar/gast_public.d.ts",
    "lib/src/parse/cache_public.d.ts",
    "lib/src/diagrams/render_public.d.ts"
]

const karmaConf = process.env.TRAVIS ? "karma_sauce.conf.js" : "karma.conf.js"

const PUBLIC_API_TS_FILES = _.map(PUBLIC_API_DTS_FILES, function(binDefFile) {
    return binDefFile.replace("lib/", "").replace(".d", "")
})

// so typedoc can compile "module.exports" in cache_public
PUBLIC_API_TS_FILES.push("./node_modules/@types/node/index.d.ts")

const fourSpaces = "    "
const examples_test_command = "npm test"

const INSTALL_LINK = "npm install && npm link chevrotain"
const INSTALL_LINK_TEST = INSTALL_LINK + " && " + examples_test_command

const banner = "/*! <%= pkg.name %> - v<%= pkg.version %> */"

module.exports = function(grunt) {
    const pkg = grunt.file.readJSON("package.json")

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        run: {
            options: {
                failOnError: true
            },
            npm_link: {
                exec: "npm link"
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
                    "npm --prefix ./webpack link chevrotain" +
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
                    cwd: process.cwd() + "/docs/01_Tutorial/src/"
                },
                exec: INSTALL_LINK + " && npm test"
            }
        },

        karma: {
            options: {
                configFile: karmaConf,
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
                        {
                            pattern: "test_integration/*/*.js",
                            included: false
                        },
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
                        {
                            pattern: "test_integration/*/*.js",
                            included: false
                        },
                        "test_integration/integration_tests_main.js"
                    ]
                }
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
                        const withOutImports = src.replace(
                            /import.*;(\n|\r\n)/g,
                            ""
                        )
                        // TODO: investigate why do Typescript definition files include private members.
                        const withoutPrivate = withOutImports.replace(
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
        }
    })

    require("load-grunt-tasks")(grunt)

    const integrationTestsNodeTasks = [
        "run:npm_link",
        "run:test_examples_grammars",
        "run:test_examples_parser",
        "run:test_examples_lexer",
        "run:test_examples_implementation_languages",
        "run:test_tutorial"
    ]

    const browserTestsTasks = [
        "karma:browsers_unit_tests",
        "karma:browsers_integration_tests_globals",
        "karma:browsers_integration_tests_globals_minified",
        "karma:browsers_integration_tests_amd",
        "karma:browsers_integration_tests_amd_minified"
    ]

    grunt.registerTask("browsers_tests", browserTestsTasks)
    grunt.registerTask("integration_tests", integrationTestsNodeTasks)
}
