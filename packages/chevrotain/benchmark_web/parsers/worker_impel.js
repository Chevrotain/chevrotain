self.initialized = false;

onmessage = async function (event) {
  if (!initialized) {
    self.initialized = true;

    if (event.data.parserConfig) {
      self.parserConfig = event.data.parserConfig;
    }

    for (const elem of event.data.importScripts) {
      await import(elem);
    }

    if (event.data.sampleUrl) {
      var xhrObj = new XMLHttpRequest();
      xhrObj.open("GET", event.data.sampleUrl, false);
      xhrObj.send("");

      self.sample = xhrObj.responseText;
    }
    self.startRule = event.data.startRule;
  } else {
    var options = event.data[0];

    try {
      self.parseBench(
        self.sample,
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
