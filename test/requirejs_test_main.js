require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    paths: {
        'lodash':     'bower_components/lodash/lodash'
    },

    deps: ['bin/chevrotainSpecs'],

    callback: window.__karma__.start
});
