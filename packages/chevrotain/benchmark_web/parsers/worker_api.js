var parserWorker
var globalDeferred

function initWorker(options) {
  // relative to the nested iframe
  parserWorker = new Worker("../worker_impel.js")

  parserWorker.postMessage(options)
  parserWorker.onmessage = function(errCode) {
    globalDeferred.resolve()
  }
}

function parse(options, deferred) {
  globalDeferred = deferred
  parserWorker.postMessage([options])
}
