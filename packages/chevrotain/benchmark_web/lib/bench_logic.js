// ---- Warmup Configuration ----
// Number of times each benchmark scenario is run before the actual measurement starts.
// Warmup allows the V8 engine to JIT-compile and optimize the hot code paths,
// leading to more consistent and representative benchmark results.
var warmupIterations = 3000;

// Initialization benchmarks are much slower per iteration (each creates new
// Lexer/Parser instances), so we use far fewer warmup iterations.
var initWarmupIterations = 100;

// Tracks which (testCase, mode) combinations have already been warmed up this session.
// Keys are like "JSON:both", "CSS:lexerOnly", "ECMA5:parserOnly".
// Warmup only runs once per unique combination -- re-running the benchmark skips it.
var warmedUpKeys = new Set();

function getWarmupModeKey() {
  if (initLexer && initParser) return "initBoth";
  if (initLexer) return "initLexer";
  if (initParser) return "initParser";
  if (lexerOnly) return "lexerOnly";
  if (parserOnly) return "parserOnly";
  return "both";
}

// ---- localStorage helpers ----
// All "latest" benchmark results are stored under a single key as structured JSON:
//   {
//     version: "12.0.0",          // Chevrotain version used when benching "latest"
//     results: {
//       "JSON":  { "both": 1234, "lexerOnly": 2345, "parserOnly": 3456 },
//       "CSS":   { ... },
//       "ECMA5": { ... }
//     }
//   }
var STORAGE_KEY = "chevrotain_bench_latest";

function getVariantKey() {
  if (initLexer && initParser) return "initBoth";
  if (initLexer) return "initLexer";
  if (initParser) return "initParser";
  if (lexerOnly) return "lexerOnly";
  if (parserOnly) return "parserOnly";
  return "both";
}

// Returns true if the current mode involves lexer measurement.
// ECMA5 uses a custom lexer (Acorn), not Chevrotain's Lexer, so its
// results are not applicable for any mode that measures lexer performance.
function isLexerInvolvedMode() {
  if (lexerOnly) return true;
  if (initLexer) return true;
  // Default "both" mode (lex + parse) also involves the lexer.
  if (!parserOnly && !initParser) return true;
  return false;
}

function loadStoredResults() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { version: null, results: {} };
  } catch (e) {
    return { version: null, results: {} };
  }
}

function saveStoredResults(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Read the Chevrotain VERSION that was loaded inside the Web Worker.
// The worker posts it after initialization and worker_api.js exposes it
// as `self.chevrotainVersion` on the iframe's contentWindow.
function getChevrotainVersion() {
  var iframeIds = ["JSON", "CSS", "ECMA5"];
  for (var i = 0; i < iframeIds.length; i++) {
    var iframe = document.getElementById(iframeIds[i]);
    if (
      iframe &&
      iframe.contentWindow &&
      iframe.contentWindow.chevrotainVersion
    ) {
      return iframe.contentWindow.chevrotainVersion;
    }
  }
  return null;
}

var orgData = {
  labels: [],
  datasets: [
    {
      label: "",
      fillColor: "rgba(220,220,220,0.5)",
      strokeColor: "rgba(220,220,220,0.8)",
      highlightFill: "rgba(220,220,220,0.75)",
      highlightStroke: "rgba(220,220,220,1)",
      data: [],
    },
  ],
};

var data = _.cloneDeep(orgData);

function clearData() {
  data = _.cloneDeep(orgData);
}

function clearTable() {
  // when using .empty() the cells collapse... so, use non-breaking space
  $(".dataRow .benchRate .value").html("&nbsp;");
  $(".dataRow .benchRate .delta").html("&nbsp;");
  $(".dataRow .benchTime").html("&nbsp;");
  $(".dataRow .benchSpeed").html("&nbsp;");
  $(".fastestRow").removeClass("fastestRow");
}

function clearResults() {
  clearTable();
  clearData();
}

async function runWarmup(enabledTestCaseNames) {
  var $warmupStatus = $("#warmup-status");
  var modeKey = getWarmupModeKey();
  var isInitMode = initLexer || initParser;
  var iterations = isInitMode ? initWarmupIterations : warmupIterations;

  var coldNames = enabledTestCaseNames.filter(function (name) {
    return !warmedUpKeys.has(name + ":" + modeKey);
  });

  if (coldNames.length === 0) {
    return;
  }

  for (var i = 0; i < coldNames.length; i++) {
    var name = coldNames[i];
    var iframe = document.getElementById(name);
    var parseAction = iframe.contentWindow.parse;

    for (var j = 0; j < iterations; j++) {
      await new Promise(function (resolve) {
        parseAction(
          {
            lexerOnly: lexerOnly,
            parserOnly: parserOnly,
            initLexer: initLexer,
            initParser: initParser,
          },
          { resolve: resolve },
        );
      });
      $warmupStatus.text(name + " (" + (j + 1) + "/" + iterations + ")");
    }

    warmedUpKeys.add(name + ":" + modeKey);
  }

  $warmupStatus.text("Warmup complete");
  await new Promise(function (resolve) {
    setTimeout(resolve, 800);
  });
  $warmupStatus.html("&nbsp;");
}

async function onRunAll(options) {
  lexerOnly = options && options.lexerOnly === true;
  parserOnly = options && options.parserOnly === true;
  initLexer = options && options.initLexer === true;
  initParser = options && options.initParser === true;

  // Highlight the active variant button so it is visible in screenshots.
  $("button.activeVariant").removeClass("activeVariant");
  var activeId = "runAllButton";
  if (options) {
    if (options.lexerOnly) activeId = "runAllButton_lexer";
    else if (options.parserOnly) activeId = "runAllButton_parser";
    else if (options.initLexer && options.initParser)
      activeId = "runAllButton_initBoth";
    else if (options.initLexer) activeId = "runAllButton_initLexer";
    else if (options.initParser) activeId = "runAllButton_initParser";
  }
  $("#" + activeId).addClass("activeVariant");

  clearResults();

  // These names are in the order in which they appear in the DOM
  var enabledTestCaseNames = _.map(
    $(".dataRow").has(":checked"),
    function (currDataRow) {
      var currClassNames = $(currDataRow).attr("class").split(" ");
      return _.first(
        _.difference(currClassNames, ["dataRow", "json-only", "hide"]),
      );
    },
  );

  // ECMA5 uses a custom (Acorn) lexer, not Chevrotain's Lexer.
  // Skip it for any mode that involves lexer measurement.
  if (isLexerInvolvedMode()) {
    enabledTestCaseNames = enabledTestCaseNames.filter(function (name) {
      return name !== "ECMA5";
    });
    $(".ECMA5 .benchRate .value").html("N/A");
    $(".ECMA5 .benchRate .delta").html("&nbsp;");
    $(".ECMA5 .benchTime").html("N/A");
    $(".ECMA5 .benchSpeed").html("N/A");
  }

  if (_.isEmpty(enabledTestCaseNames)) {
    // otherwise the run button will never become enabled again and
    // the performance page will be stuck indefinitely.
    return;
  }

  $("#runAllButton").prop("disabled", true);
  $("#runAllButton_lexer").prop("disabled", true);
  $("#runAllButton_parser").prop("disabled", true);
  $("#runAllButton_initLexer").prop("disabled", true);
  $("#runAllButton_initParser").prop("disabled", true);
  $("#runAllButton_initBoth").prop("disabled", true);

  // --- Warmup phase ---
  // Only runs for (grammar, mode) combinations not yet warmed up this session.
  var modeKey = getWarmupModeKey();
  var coldNames = enabledTestCaseNames.filter(function (name) {
    return !warmedUpKeys.has(name + ":" + modeKey);
  });

  var warmupDots;
  if (coldNames.length > 0) {
    var warmupLabel = "Warming up";
    document.getElementById("wait").innerHTML = warmupLabel;
    warmupDots = window.setInterval(function () {
      var waitEl = document.getElementById("wait");
      if (waitEl.innerHTML.length >= warmupLabel.length + 3)
        waitEl.innerHTML = warmupLabel;
      else waitEl.innerHTML += ".";
    }, 500);
  }

  await runWarmup(enabledTestCaseNames);
  if (warmupDots !== undefined) {
    window.clearInterval(warmupDots);
  }

  // --- Benchmark phase ---
  // more minSamples (default=5) for more accurate & consistent results.
  Benchmark.options.minSamples = 25;

  var runningLabel = "Running";
  document.getElementById("wait").innerHTML = runningLabel;
  var dots = window.setInterval(function () {
    var waitEl = document.getElementById("wait");
    if (waitEl.innerHTML.length >= runningLabel.length + 3)
      waitEl.innerHTML = runningLabel;
    else waitEl.innerHTML += ".";
  }, 500);

  var suite = new Benchmark.Suite();

  var enabledTestCaseDefs = _.pick(testCases, enabledTestCaseNames);
  // adds the tests in the order they appear in the DOM table.
  _.forEach(enabledTestCaseDefs, function (currTestCaseDefFn) {
    currTestCaseDefFn(suite);
  });

  suite
    .on("cycle", function (event) {
      var suite = event.target;
      var rate = suite.hz.toFixed(2);
      var $rate = $("." + suite.name + " .benchRate .value");
      var $delta = $("." + suite.name + " .benchRate .delta");

      $rate.html(rate);
      $delta.html("&plusmn;" + suite.stats.rme.toFixed(2) + "%");

      var avgTimeUs = ((1 / suite.hz) * 1000000).toFixed(2);
      $("." + suite.name + " .benchTime").html(avgTimeUs + " &micro;s");

      data.labels.push(suite.name);
      data.datasets[0].data.push(rate);

      try {
        var variantKey = getVariantKey();

        if (self.mode === "latest") {
          // Store latest released version results to compare with dev version
          // in the other window. Results are keyed by grammar and variant so
          // all three variants can coexist in localStorage.
          var stored = loadStoredResults();
          stored.version = getChevrotainVersion();
          if (!stored.results[suite.name]) {
            stored.results[suite.name] = {};
          }
          stored.results[suite.name][variantKey] = suite.hz;
          saveStoredResults(stored);

          var cell = $("." + suite.name + " .benchSpeed");
          cell.html("100%");
        }
        if (self.mode === "next") {
          var cell = $("." + suite.name + " .benchSpeed");
          var stored = loadStoredResults();
          var grammarResults = stored.results && stored.results[suite.name];
          var storedLatestHz = grammarResults && grammarResults[variantKey];

          if (storedLatestHz) {
            var speed = ((suite.hz / storedLatestHz).toFixed(4) * 100).toFixed(
              2,
            );
            var label = speed + "%";
            if (stored.version) {
              label += " (vs " + stored.version + ")";
            }
            cell.html(label);
          } else {
            cell.html("???");
          }
        }
      } catch (e) {
        console.warn(e);
      }
    })
    .on("complete", function () {
      try {
        var suites = this.filter("successful"),
          fastestSuite = this.filter("fastest")[0];

        suites.splice(suites.indexOf(fastestSuite), 1);

        window.clearInterval(dots);
        $("#wait").html("&nbsp;");
      } finally {
        // TODO: investigate hack around strange race condition
        setTimeout(function () {
          $("#runAllButton").prop("disabled", false);
          $("#runAllButton_lexer").prop("disabled", false);
          $("#runAllButton_parser").prop("disabled", false);
          $("#runAllButton_initLexer").prop("disabled", false);
          $("#runAllButton_initParser").prop("disabled", false);
          $("#runAllButton_initBoth").prop("disabled", false);
        }, 1000);
      }
    })
    .run({ async: true });
}
