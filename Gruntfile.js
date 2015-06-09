/**
 * Grunt project configuration.
 */
module.exports = function(grunt) {
    // configuration for the plugins.
    grunt.initConfig({
        clean: {
            dist : [
                'lib/'
            ],

            client : [
                'client/'
            ],

            iframe : [
                'iframe/'
            ]
        },

        concat: {
            options: {
                sourceMap: true
            },

            dist: {
                files: [
                    {
                        src: [
                            'src/node/shell-prefix.js',
                            'src/node/requires.js',
                            'src/server/Watcher.js',
                            'src/server/ChangeServer.js',
                            'src/server/CommandLineParser.js',
                            'src/server/IFrameServer.js',
                            'src/server/ExecuteCommandsServer.js',
                            'src/server/ExecutorSet.js',

                            'src/node/show-help.js',
                            'src/node/read-parameters.js',
                            'src/node/server-main.js'
                        ],
                        dest: 'lib/fast-live-reload.js'
                    }
                ]
            },

            client: {
                files: [
                    {
                        src: [
                            'src/client/_wrap-before.js',
                            'src/client/ajax-call.js',
                            'src/client/parameter-parser.js',
                            'src/client/update-notifier.js',
                            'src/client/client-main.js',
                            'src/client/_wrap-after.js'
                        ],
                        dest: 'client/client-fast-reload.js'
                    }
                ]
            },

            iframe: {
                files: [
                    {
                        src: [
                            'src/iframe/_wrap-before.js',
                            'src/client/ajax-call.js',
                            'src/client/parameter-parser.js',
                            'src/client/update-notifier.js',

                            'src/iframe/js/iframe-site.js',
                            'src/iframe/js/iframe-main.js',

                            'src/iframe/_wrap-after.js'
                        ],
                        dest: 'iframe/fast-live-reload/js/iframe-reload.js'
                    }
                ]
            }
        },

        sync : {
            'client-tmp' : {
                // pretend: true,
                verbose: true,
                files : [
                    {
                        expand: true,
                        cwd: 'client/',
                        src: ['**'],
                        dest: 'tmp/'
                    }
                ]
            },

            'iframe' : {
                verbose: true,
                files: [
                    {
                        expand: true,
                        cwd: 'src/iframe/',
                        src: [
                            'js/jquery.js',
                            '*.handlebars',
                            '*.html'
                        ],
                        dest: 'iframe/fast-live-reload/'
                    }
                ]
            },

            'dist' : {
                verbose: true,
                files: [
                    {
                        cwd: 'src/doc/',
                        expand: true,
                        src: [
                            'readme.hbs'
                        ],
                        dest: 'lib/'
                    }
                ]
            }
        },

        compass: {
            iframe : {
                options: {
                    sassDir: 'src/iframe/scss',
                    cssDir: 'iframe/fast-live-reload/css',
                    sourcemap: true
                    // environment: 'production'
                }
            }
        },

        watch : { // development mode
            dist : {
                files: [ 'src/**/*' ],
                tasks: [ 'default' ]
            },

            iframe: {
                files: [ 'src/**/*' ],
                tasks: [ 'build-iframe-client' ]
            }
        }
    });

    // load NPM tasks:
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-compass');

    // register our tasks:
    grunt.registerTask('build-client', ['concat:client', 'sync:client-tmp']);
    grunt.registerTask('build-server', ['concat:dist', 'sync:dist']);
    grunt.registerTask('build-iframe-client', ['concat:iframe', 'sync:iframe', 'compass:iframe']);

    grunt.registerTask('clean-all', ['clean:client', 'clean:dist', 'clean:iframe']);
    grunt.registerTask('build-all', ['build-client', 'build-server', 'build-iframe-client']);

    grunt.registerTask('default', ['clean-all', 'build-all']);
};

