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
    return raw ? JSON.parse(raw) : { version: null, results: {}, records: {} };
  } catch (e) {
    return { version: null, results: {}, records: {} };
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
  var metadata = document.getElementById("benchmark-metadata");
  if (metadata) {
    metadata.textContent = "";
  }
}

function setRunButtonsDisabled(disabled) {
  $("#runAllButton").prop("disabled", disabled);
  $("#runAllButton_lexer").prop("disabled", disabled);
  $("#runAllButton_parser").prop("disabled", disabled);
  $("#runAllButton_initLexer").prop("disabled", disabled);
  $("#runAllButton_initParser").prop("disabled", disabled);
  $("#runAllButton_initBoth").prop("disabled", disabled);
}

function parserOverheadRatio(result) {
  return Math.max(
    0,
    (result.roundTripMs - result.elapsedMs) / result.elapsedMs,
  );
}

function appendParserMetadata(name, record) {
  var metadata = document.getElementById("benchmark-metadata");
  if (!metadata) {
    return;
  }
  var details = record.candidateMetadata;
  var summary = {
    grammar: name,
    version: details.chevrotainVersion,
    sample: details.sampleId,
    inputBytes: details.inputBytes,
    inputChecksum: details.inputChecksum,
    tokenCount: details.tokenCount,
    tokenChecksum: details.tokenChecksum,
    parserConfig: details.parserConfig,
    batchIterations: record.iterations,
    workerOverheadPercent: (record.workerOverheadRatio * 100).toFixed(2),
    warmupMs: Math.round(record.warmup.elapsedMs),
    warmupStable: record.warmup.stable,
    samples: record.candidateStats.sampleCount,
  };
  metadata.textContent += JSON.stringify(summary) + "\n";
}

function renderParserResult(name, record) {
  var stats = record.candidateStats;
  $("." + name + " .benchRate .value").html(stats.hz.toFixed(2));
  $("." + name + " .benchRate .delta").html(
    "&plusmn;" + stats.rme.toFixed(2) + "%",
  );
  $("." + name + " .benchTime").html(
    (stats.meanMs * 1000).toFixed(2) + " &micro;s",
  );

  var speedCell = $("." + name + " .benchSpeed");
  if (record.pairedSpeed !== undefined) {
    speedCell.html(
      (record.pairedSpeed * 100).toFixed(2) +
        "% (vs " +
        record.baselineMetadata.chevrotainVersion +
        ")",
    );
  } else {
    speedCell.html("100%");
  }
  appendParserMetadata(name, record);
}

async function waitForParserFrame(frame) {
  var started = performance.now();
  while (typeof frame.restartWorker !== "function") {
    if (performance.now() - started > 30000) {
      throw Error("Parser benchmark iframe did not load");
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, 25);
    });
  }
  await frame.waitForWorkerReady();
}

async function runParserOnlyCase(name) {
  var candidateFrame = self.parserBenchmarkFrames[name];
  var baselineFrame =
    self.parserBaselineFrames && self.parserBaselineFrames[name];
  var frames = baselineFrame
    ? [baselineFrame, candidateFrame]
    : [candidateFrame];

  await Promise.all(frames.map(waitForParserFrame));
  await Promise.all(
    frames.map(function (frame) {
      return frame.restartWorker();
    }),
  );

  var metadata = [];
  for (var i = 0; i < frames.length; i++) {
    metadata.push(await frames[i].setupParserBenchmark());
  }
  if (baselineFrame) {
    var mismatch = ParserBenchmark.metadataMismatch(metadata[0], metadata[1]);
    if (mismatch !== undefined) {
      throw Error(name + " baseline metadata mismatch: " + mismatch);
    }
  }

  var calibrations = [];
  for (var j = 0; j < frames.length; j++) {
    calibrations.push(await ParserBenchmark.calibrate(frames[j]));
  }
  var iterations = Math.max.apply(
    null,
    calibrations.map(function (calibration) {
      return calibration.iterations;
    }),
  );

  var warmup = await ParserBenchmark.warm(
    frames,
    iterations,
    function (elapsedMs) {
      $("#warmup-status").text(name + " (" + elapsedMs + "ms)");
    },
  );
  if (!warmup.stable) {
    throw Error(name + " parser throughput did not stabilize during warmup");
  }
  var stats = await ParserBenchmark.measure(frames, iterations);
  var overheadResult = await candidateFrame.runParserBatch(iterations);

  var record = {
    candidateMetadata: metadata[baselineFrame ? 1 : 0],
    candidateStats: stats[baselineFrame ? 1 : 0],
    baselineMetadata: baselineFrame ? metadata[0] : undefined,
    baselineStats: baselineFrame ? stats[0] : undefined,
    pairedSpeed: baselineFrame
      ? ParserBenchmark.pairedSpeed(stats[0].samples, stats[1].samples)
      : undefined,
    iterations: iterations,
    warmup: warmup,
    workerOverheadRatio: parserOverheadRatio(overheadResult),
    measuredAt: new Date().toISOString(),
  };

  renderParserResult(name, record);
  if (self.mode === "latest") {
    var stored = loadStoredResults();
    stored.version = record.candidateMetadata.chevrotainVersion;
    stored.results[name] = stored.results[name] || {};
    stored.results[name].parserOnly = record.candidateStats.hz;
    stored.records = stored.records || {};
    stored.records[name] = stored.records[name] || {};
    stored.records[name].parserOnly = record;
    saveStoredResults(stored);
  }
  return record;
}

async function runParserOnlyBenchmarks(enabledTestCaseNames) {
  if (self.ensureParserBaselineFrames) {
    self.parserBaselineFrames =
      self.ensureParserBaselineFrames(enabledTestCaseNames);
  }
  var allFrames = enabledTestCaseNames.map(function (name) {
    return self.parserBenchmarkFrames[name];
  });
  if (self.parserBaselineFrames) {
    allFrames = allFrames.concat(
      enabledTestCaseNames.map(function (name) {
        return self.parserBaselineFrames[name];
      }),
    );
  }
  await Promise.all(allFrames.map(waitForParserFrame));

  document.getElementById("wait").textContent = "Running parser batches";
  var records = {};
  try {
    for (var i = 0; i < enabledTestCaseNames.length; i++) {
      var name = enabledTestCaseNames[i];
      try {
        records[name] = await runParserOnlyCase(name);
      } catch (error) {
        $("." + name + " .benchRate .value").text("ERROR");
        $("." + name + " .benchTime").text(error.message);
        throw error;
      }
    }
  } finally {
    if (self.parserBaselineFrames) {
      enabledTestCaseNames.forEach(function (name) {
        self.parserBaselineFrames[name].stopWorker();
      });
    }
  }
  self.lastParserBenchmarkRecords = records;
  return records;
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
      await new Promise(function (resolve, reject) {
        parseAction(
          {
            lexerOnly: lexerOnly,
            parserOnly: parserOnly,
            initLexer: initLexer,
            initParser: initParser,
          },
          { resolve: resolve, reject: reject },
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

  setRunButtonsDisabled(true);

  if (parserOnly) {
    try {
      await runParserOnlyBenchmarks(enabledTestCaseNames);
      $("#warmup-status").html("&nbsp;");
      $("#wait").html("&nbsp;");
    } catch (error) {
      console.error(error);
      $("#wait").text("Parser benchmark failed: " + error.message);
    } finally {
      setRunButtonsDisabled(false);
    }
    return;
  }

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

  try {
    await runWarmup(enabledTestCaseNames);
  } catch (error) {
    if (warmupDots !== undefined) {
      window.clearInterval(warmupDots);
    }
    $("#wait").text("Benchmark warmup failed: " + error.message);
    $("#warmup-status").html("&nbsp;");
    setRunButtonsDisabled(false);
    return;
  }
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
          setRunButtonsDisabled(false);
        }, 1000);
      }
    })
    .run({ async: true });
}
