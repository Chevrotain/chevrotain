const examples_test_command = "yarn test"
const INSTALL_LINK = "yarn install && yarn link chevrotain"
const INSTALL_LINK_TEST = INSTALL_LINK + " && " + examples_test_command
const UNLINK = " && yarn unlink chevrotain"

module.exports = function(grunt) {
    const pkg = grunt.file.readJSON("package.json")

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        run: {
            options: {
                failOnError: true
            },
            yarn_link: {
                exec: "yarn link"
            },
            test_examples_lexer: {
                options: {
                    cwd: process.cwd() + "/examples/lexer/"
                },
                exec: INSTALL_LINK_TEST + UNLINK
            },
            test_examples_grammars: {
                options: {
                    cwd: process.cwd() + "/examples/grammars/"
                },
                exec: INSTALL_LINK_TEST + UNLINK
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
                    "cd webpack" +
                    " && " +
                    "yarn install" +
                    " && " +
                    "yarn link chevrotain" +
                    " && " +
                    "cd .." +
                    " && " +
                    examples_test_command +
                    UNLINK
            },
            test_examples_implementation_languages: {
                options: {
                    cwd: process.cwd() + "/examples/implementation_languages/"
                },
                exec: INSTALL_LINK + " && yarn test" + UNLINK
            },
            test_examples_tutorial: {
                options: {
                    cwd: process.cwd() + "/examples/tutorial/"
                },
                exec: INSTALL_LINK + " && yarn test" + UNLINK
            },
            test_examples_custom_apis: {
                options: {
                    cwd: process.cwd() + "/examples/custom_apis/"
                },
                exec: INSTALL_LINK + " && yarn test" + UNLINK
            }
        },

        karma: {
            options: {
                configFile: "karma.conf.js",
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
        }
    })

    require("load-grunt-tasks")(grunt)

    const integrationTestsNodeTasks = [
        "run:yarn_link",
        "run:test_examples_grammars",
        "run:test_examples_parser",
        "run:test_examples_lexer",
        "run:test_examples_implementation_languages",
        "run:test_examples_tutorial",
        "run:test_examples_custom_apis"
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
