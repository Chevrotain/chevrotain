module.exports = function (grunt) {
  const pkg = grunt.file.readJSON("package.json")

  //noinspection UnnecessaryLabelJS
  grunt.initConfig({
    pkg: pkg,

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

  const browserTestsTasks = [
    "karma:browsers_unit_tests",
    "karma:browsers_integration_tests_globals",
    "karma:browsers_integration_tests_globals_minified",
    "karma:browsers_integration_tests_amd",
    "karma:browsers_integration_tests_amd_minified"
  ]

  grunt.registerTask("browsers_tests", browserTestsTasks)
}
