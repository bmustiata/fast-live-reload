/**
 * Grunt project configuration.
 */
module.exports = function(grunt) {
    // configuration for the plugins.
    grunt.initConfig({
        clean: {
            dist : [
                "lib/"
            ],

            client : [
                "client/"
            ],

            iframe : [
                "iframe/"
            ]
        },

        concat: {
            options: {
                sourceMap: true
            },

            dist: {
                files: [
                    { src: [
                        'src/node/shell-prefix.js',
                        'src/node/requires.js',
                        "src/watcher.js",
                        "src/static-server.js",
                        "src/change-server.js",
                        "src/iframe-server.js",
                        "src/server-main.js"
                    ], dest: 'lib/fast-live-reload.js' }
                ]
            },

            client: {
                files: [
                    {
                        src: [
                            "src/client/_wrap-before.js",
                            "src/client/ajax-call.js",
                            "src/client/parameter-parser.js",
                            "src/client/update-notifier.js",
                            "src/client/client-main.js",
                            "src/client/_wrap-after.js"
                        ],
                        dest: "client/client-fast-reload.js"
                    }
                ]
            },

            iframe: {
                files: [
                    {
                        src: [
                            "src/iframe/_wrap-before.js",
                            "src/client/ajax-call.js",
                            "src/client/parameter-parser.js",
                            "src/client/update-notifier.js",

                            "src/iframe/js/iframe-site.js",
                            "src/iframe/js/iframe-main.js",

                            "src/iframe/_wrap-after.js"
                        ],
                        dest: "iframe/fast-live-reload/js/iframe-reload.js"
                    }
                ]
            }
        },

        sync : {
            'client-tmp' : {
                // pretend: true,
                verbose: true,
                files : [
                    { expand: true, cwd: 'client/', src: ['**'], dest: 'tmp/' }
                ]
            },

            'iframe' : {
                verbose: true,
                files: [
                    {
                        expand: true,
                        cwd: 'src/iframe/',
                        src: [
                            'css/*',
                            'js/jquery.js',
                            '*',
                        ],
                        dest: 'iframe/fast-live-reload/'
                    }
                ]
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

    // register our tasks:
    grunt.registerTask('build-client', ['clean:client', 'concat:client', 'sync:client-tmp']);
    grunt.registerTask('build-server', ['clean:dist', 'concat:dist']);
    grunt.registerTask('build-iframe-client', ['clean:iframe', 'concat:iframe', 'sync:iframe']);

    grunt.registerTask('default', ["build-server", "build-client", 'build-iframe-client']);
};

