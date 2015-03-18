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
            ]
        },

        concat: {
            options: {
                sourceMap: true
            },

            dist: {
                files: [
                    { src: [
                        'src/node/requires.js',
                        "src/watcher.js",
                        "src/application.js",
                        "src/main.js"
                    ], dest: 'lib/fast-live-reload.js' }
                ]
            },

            client: {
                files: [
                    {
                        src: [
                            "src/client/_wrap-before.js",
                            "src/client/ajax-call.js",
                            "src/client/load-updates.js",
                            "src/client/_wrap-after.js"
                        ],
                        dest: "client/fast-live-reload.js"
                    }
                ]
            }
        }
    });

    // load NPM tasks:
    // grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // register our tasks:
    grunt.registerTask('build-client', ['clean:client', 'concat:client']);
    grunt.registerTask('build-server', ['clean:dist', 'concat:dist']);

    grunt.registerTask('default', ["build-server", "build-client"]);
};

