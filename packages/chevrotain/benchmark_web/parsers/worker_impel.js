var initialized = false;
var startRule;
var parserConfig = {};
onmessage = function (event) {
  if (!initialized) {
    initialized = true;
    event.data.importScripts.forEach(function (elem) {
      importScripts(elem);
    });

    if (event.data.sampleUrl) {
      var xhrObj = new XMLHttpRequest();
      xhrObj.open("GET", event.data.sampleUrl, false);
      xhrObj.send("");

      self.sample = xhrObj.responseText;
    }
    startRule = event.data.startRule;
    if (event.data.parserConfig) {
      parserConfig = event.data.parserConfig;
    }
  } else {
    var options = event.data[0];

    try {
      parseBench(
        sample,
        self.lexerDefinition || undefined,
        self.customLexer || undefined,
        parser,
        startRule,
        options,
        parserConfig,
      );
      postMessage(0);
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);
      postMessage(1);
    }
  }
};
