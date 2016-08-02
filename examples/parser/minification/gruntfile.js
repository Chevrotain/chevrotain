/**
 * This example shows how to minifiy A Chevrotain Grammar.
 * Specifically the name mangling options required when using uglifyjs to avoid
 * "breaking" chevrotain grammars during minification.
 */


var chevrotain = require("chevrotain")

// DOCS: extracting to Token names to perform "gentle" minification with reserved function names.
var jsonTokens = require('./unminified.js').jsonTokens
var jsonTokenNames = jsonTokens.map(function(currTok) {
    return chevrotain.tokenName(currTok)
})

module.exports = function(grunt) {

    grunt.initConfig({

        mocha_istanbul: {
            coverage: {
                src:     './',
                options: {
                    mask:           '**/*spec.js',
                    coverageFolder: 'coverage'
                }
            }
        },

        uglify: {
            minify_disable_mangling: {
                options: {
                    // A brute force approach to solve the issue of minifing chevrotain.
                    // Will avoid name mangling completely. But with the downside that
                    // this will increase the size of the minified sources.
                    mangle: false
                },
                files:   {
                    'gen/disable_mangling.min.js': ['unminified.js']
                }
            },

            minify_selective: {
                options: {
                    mangle: {
                        // A more gentle approach to solve the minificaiton issue.
                        // Only avoid mangling Token function names.
                        // will create the smallest (working) minified file.

                        // on the command line this is the "reserved" option.
                        //   -r, --reserved                Reserved names to exclude from mangling.
                        except: jsonTokenNames
                    }
                },
                files:   {
                    'gen/selective.min.js': ['unminified.js']
                }
            },

            // DO NOT USE, may not work! only exists here to be used in a "negative test"
            // Note that this could work in some use cases, it depends on whether or not Uglifyjs believes
            // the vars/function names of the Token classes are public or not.
            // and this depends on the specific JS module pattern used. (AMD/Commonjs/UMD/...)
            minify_no_compression: {
                options: {
                    // using default compression options.
                    // this will fail at runtime.
                },
                files:   {
                    'gen/no_compression.min.js': ['unminified.js']
                }
            }
        }
    })

    // https://github.com/gruntjs/grunt/issues/696#issuecomment-63192649
    grunt.file.expand('../node_modules/grunt-*/tasks').forEach(grunt.loadTasks)

    grunt.registerTask('default', ['uglify'])
    grunt.registerTask('build', ['uglify', 'mocha_istanbul:coverage'])
}
