/**
 * based on https://github.com/x2es/boilerplate-karma-mocha-chai-requirejs/blob/master/test/test-main.js
 */
;(function() {
  var specFiles = null
  var requirejsCallback = null

  requirejsCallback = window.__karma__.start

  specFiles = []
  for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
      if (/.*test_integration.+_spec\.js$/.test(file)) {
        specFiles.push(file)
      }
    }
  }

  requirejs.config({
    baseUrl: "/base",

    // ask Require.js to load these files (all our tests)
    deps: specFiles,

    // start test run, once Require.js is done
    callback: requirejsCallback
  })
})()
