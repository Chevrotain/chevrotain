var initialized = false
var startRule
onmessage = function(event) {
    if (!initialized) {
        initialized = true
        event.data.importScripts.forEach(function(elem) {
            importScripts(elem)
        })
        startRule = event.data.startRule
    } else {
        var options = event.data[0]

        try {
            // todo: dynamic root rule support
            parseBench(sample, lexer, parser, startRule, options)
            postMessage(0)
        } catch (e) {
            console.error(e.message)
            postMessage(1)
        }
    }
}
