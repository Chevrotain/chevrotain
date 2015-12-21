module.exports = function(grunt) {

    var pkg = grunt.file.readJSON('package.json')

    //noinspection UnnecessaryLabelJS
    grunt.initConfig({
        pkg: pkg,

        karma: {
            options: {
                configFile: 'karma.conf.js',
                singleRun:  true,
                browsers:   ['Chrome']
            },

            dev_build: {}
        },

        mocha_istanbul: {
            coverage: {
                src:     'bin/ecma5.js',
                options: {
                    root:           './bin/',
                    mask:           '*cma5Specs.js',
                    coverageFolder: 'bin/coverage',
                    excludes:       ['*cma5Specs.js']
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },

            files: {
                // performance_spec causes issues with TS-Lint randomly crashing due to a very large sample string it contains.
                src: ['src/**/*.ts', 'test/**/*.ts']
            }
        },

        ts: {
            options: {
                bin:  "ES5",
                fast: "never"

            },

            dev_build: {
                src:    ["**/*.ts", "!node_modules/**/*.ts", "!build/**/*.ts", "!bin/**/*.ts"],
                outDir: "bin/gen"
            },

            release: {
                src:     ['build/ecma5.ts'],
                out:     'bin/ecma5.js',
                options: {
                    declaration:    true,
                    removeComments: false,
                    sourceMap:      false // due to UMD generated headers the original source map will be invalid.
                }
            },

            release_spec: {
                src:     ['build/ecma5Specs.ts'],
                out:     'bin/ecma5Specs.js',
                options: {
                    declaration:    false,
                    removeComments: false,
                    sourceMap:      false // due to UMD generated headers the original source map will be invalid.
                }
            }
        },

        umd: {
            release: {
                options: {
                    src:            'bin/ecma5.js',
                    objectToExport: 'ecma5',
                    amdModuleId:    'ecma5',
                    globalAlias:    'ecma5',
                    deps:           {
                        'default': ['_', 'chevrotain'],
                        amd:       ['lodash', 'chevrotain'],
                        cjs:       ['lodash', 'chevrotain'],
                        global:    ['_', 'chevrotain']
                    }
                }
            },

            release_specs: {
                options: {
                    src:      'bin/ecma5Specs.js',
                    deps:     {
                        'default': ['_', 'ecma5', 'chai'],
                        amd:       ['lodash', 'ecma5', 'chai'],
                        cjs:       ['lodash', './ecma5', 'chai'],
                        global:    ['_', 'ecma5', 'chai']
                    }
                }
            }
        },

        clean: {
            all: ["bin"],
            dev: ["bin/gen"]
        }
    })

    grunt.loadNpmTasks('grunt-karma')
    grunt.loadNpmTasks('grunt-tslint')
    grunt.loadNpmTasks("grunt-ts")
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-mocha-istanbul')
    grunt.loadNpmTasks('grunt-umd')


    var buildTaskTargets = [
        'clean:all',
        'tslint',
        'ts:release',
        'ts:release_spec',
        'umd:release',
        'umd:release_specs'
    ]

    grunt.registerTask('build', buildTaskTargets)
    grunt.registerTask('build_and_test', buildTaskTargets.concat(['mocha_istanbul:coverage']))
    grunt.registerTask('test', ['mocha_istanbul:coverage'])

    grunt.registerTask('dev_build', [
        'clean:all',
        'tslint',
        'ts:dev_build',
        'karma:dev_build',
        'tslint'
    ])

}
