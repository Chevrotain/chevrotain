module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        mocha_istanbul: {
            pudu: {
                src:     'bin/test/pudu',
                options: {
                    mask:           '**/*spec.js',
                    coverageFolder: 'bin/examples/coverage'
                }
            },

            examples: {
                src:     'bin/test/examples',
                options: {
                    mask:           '**/*spec.js',
                    coverageFolder: 'bin/examples/coverage'
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },

            files: {
                src: ['src/pudu/**/*.ts', 'src/examples/**/*.ts', 'test/pudu/**/*.ts', 'test/examples/**/*.ts']
            }
        },

        ts: {
            options: {
                bin:  "ES5",
                fast: "never"

            },

            all: {
                src:     ['src/**/*.ts', 'test/**/*.ts', 'typings/globals/**/*.d.ts', 'typings/modules/**/*.d.ts'],
                outDir:  'bin/',
                options: {
                    module : "commonjs",
                    declaration:    false,
                    removeComments: false,
                    sourceMap:      true
                }
            }
        },

        typings: {
            install: {}
        },

        clean: {
            all: ["bin"]
        }
    })

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('build', [
        'clean:all',
        'typings:install',
        'tslint',
        'ts:all'
    ])

    grunt.registerTask('test', [
            'build',
            'mocha_istanbul:pudu',
            'mocha_istanbul:examples'
        ]
    )
}
