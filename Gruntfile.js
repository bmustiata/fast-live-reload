/**
 * Grunt project configuration.
 */
module.exports = function(grunt) {
    // configuration for the plugins.
    grunt.initConfig({
        clean: {
            dist : [
                "lib/"
            ]
        },

        concat: {
            options: {
                sourceMap: true
            },
            dist: {
                files: [
                    { src: [
                        'src/requires.js',
                        'src/**/*.js',
                        'src/main.js',
                        'src/z.js'
                    ], dest: 'lib/fast-live-reload.js' }
                ]
            }
        }
    });

    // load NPM tasks:
    // grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // register our tasks:
    grunt.registerTask('default', ["clean", "concat"]);
};
