var initialized = false
var startRule
onmessage = function(event) {
    if (!initialized) {
        initialized = true
        event.data.importScripts.forEach(function(elem) {
            importScripts(elem)
        })

        if (event.data.sampleUrl) {
            var xhrObj = new XMLHttpRequest()
            xhrObj.open("GET", event.data.sampleUrl, false)
            xhrObj.send("")

            self.sample = xhrObj.responseText
        }
        startRule = event.data.startRule
    } else {
        var options = event.data[0]

        try {
            // todo: dynamic root rule support
            parseBench(sample, lexer, parser, startRule, options)
            postMessage(0)
        } catch (e) {
            console.error(e.message)
            console.error(e.stack)
            postMessage(1)
        }
    }
}
