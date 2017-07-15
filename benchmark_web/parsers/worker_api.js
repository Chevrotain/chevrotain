var parserWorker
var globalDeferred

function initWorker(scriptsToImport) {
    // relative to the nested iframe
    parserWorker = new Worker("../worker_impel.js")

    parserWorker.postMessage(scriptsToImport)
    parserWorker.onmessage = function(errCode) {
        globalDeferred.resolve()
    }
}

function parse(options, deferred) {
    globalDeferred = deferred
    parserWorker.postMessage([options])
}
