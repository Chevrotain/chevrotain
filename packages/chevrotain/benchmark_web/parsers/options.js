const options = {
  // Tip: disable CST building to emphasize performance changes
  // due to parser engine changes, e.g better implementation of `defineRule`
  // or better lookahead logic implementation
  next: {
    // this path seems to be relative to the `worker_impel.js` file
    // where this path will be imported using `WorkerGlobalScope.importScripts()`
    bundle: "../../lib/chevrotain.js",
    parserConfig: {
      maxLookahead: 2,
      outputCst: false
    }
  },
  current: {
    bundle: "https://unpkg.com/chevrotain/lib/chevrotain.js",
    parserConfig: {
      maxLookahead: 2,
      outputCst: false
    }
  }
}

// pick correct options depending on mode
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const mode = urlParams.get("mode")
self.globalOptions = options[mode]

console.log(JSON.stringify(self.globalOptions, null, "\t"))
