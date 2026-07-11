(function (root) {
  "use strict";

  var MIN_BATCH_MS = 100;
  var MAX_BATCH_ITERATIONS = 1 << 20;
  var MAX_OVERHEAD_RATIO = 0.01;
  var MIN_WARMUP_MS = 2000;
  var MAX_WARMUP_MS = 10000;
  var STABLE_SAMPLE_COUNT = 5;
  var STABLE_DEVIATION = 0.03;
  var MEASUREMENT_SAMPLES = 25;

  function mean(values) {
    return (
      values.reduce(function (sum, value) {
        return sum + value;
      }, 0) / values.length
    );
  }

  function median(values) {
    var sorted = values.slice().sort(function (left, right) {
      return left - right;
    });
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  function summarize(samples) {
    var average = mean(samples);
    var variance =
      samples.reduce(function (sum, value) {
        var difference = value - average;
        return sum + difference * difference;
      }, 0) /
      (samples.length - 1);
    var standardDeviation = Math.sqrt(variance);
    var marginOfError = (2.064 * standardDeviation) / Math.sqrt(samples.length);

    return {
      hz: 1000 / average,
      meanMs: average,
      medianMs: median(samples),
      rme: (marginOfError / average) * 100,
      sampleCount: samples.length,
      samples: samples.slice(),
    };
  }

  function metadataMismatch(left, right) {
    var scalarKeys = [
      "grammarId",
      "sampleId",
      "inputBytes",
      "inputChecksum",
      "tokenCount",
      "tokenChecksum",
    ];
    for (var i = 0; i < scalarKeys.length; i++) {
      var key = scalarKeys[i];
      if (left[key] !== right[key]) {
        return key;
      }
    }

    if (
      JSON.stringify(left.parserConfig) !== JSON.stringify(right.parserConfig)
    ) {
      return "parserConfig";
    }
    if (
      JSON.stringify(left.sourceScripts.slice(1)) !==
      JSON.stringify(right.sourceScripts.slice(1))
    ) {
      return "sourceScripts";
    }
    return undefined;
  }

  function isStable(samples) {
    if (samples.length < STABLE_SAMPLE_COUNT) {
      return false;
    }
    var recent = samples.slice(-STABLE_SAMPLE_COUNT);
    var center = median(recent);
    return recent.every(function (sample) {
      return Math.abs(sample - center) / center <= STABLE_DEVIATION;
    });
  }

  async function calibrate(frame) {
    var iterations = 1;
    var result;
    do {
      result = await frame.runParserBatch(iterations);
      var overheadRatio = Math.max(
        0,
        (result.roundTripMs - result.elapsedMs) / result.elapsedMs,
      );
      if (
        result.elapsedMs >= MIN_BATCH_MS &&
        overheadRatio <= MAX_OVERHEAD_RATIO
      ) {
        break;
      }
      iterations *= 2;
    } while (iterations <= MAX_BATCH_ITERATIONS);

    if (iterations > MAX_BATCH_ITERATIONS) {
      throw Error("Unable to calibrate parser batch below 1% worker overhead");
    }
    return { iterations: iterations, result: result };
  }

  async function warm(frames, iterations, onProgress) {
    var started = performance.now();
    var throughputs = frames.map(function () {
      return [];
    });
    var sampleIndex = 0;

    while (performance.now() - started < MAX_WARMUP_MS) {
      for (var offset = 0; offset < frames.length; offset++) {
        var frameIndex = (sampleIndex + offset) % frames.length;
        var result = await frames[frameIndex].runParserBatch(iterations);
        throughputs[frameIndex].push(
          result.completedIterations / result.elapsedMs,
        );
      }
      sampleIndex++;
      if (onProgress) {
        onProgress(Math.round(performance.now() - started));
      }

      if (
        performance.now() - started >= MIN_WARMUP_MS &&
        throughputs.every(isStable)
      ) {
        return { elapsedMs: performance.now() - started, stable: true };
      }
    }
    return { elapsedMs: performance.now() - started, stable: false };
  }

  async function measure(frames, iterations) {
    var samples = frames.map(function () {
      return [];
    });

    for (
      var sampleIndex = 0;
      sampleIndex < MEASUREMENT_SAMPLES;
      sampleIndex++
    ) {
      for (var offset = 0; offset < frames.length; offset++) {
        var frameIndex = (sampleIndex + offset) % frames.length;
        var result = await frames[frameIndex].runParserBatch(iterations);
        if (result.completedIterations !== iterations) {
          throw Error(
            "Parser batch did not complete every requested iteration",
          );
        }
        samples[frameIndex].push(result.elapsedMs / iterations);
      }
    }

    return samples.map(summarize);
  }

  function pairedSpeed(baselineSamples, candidateSamples) {
    var ratios = baselineSamples.map(function (baseline, index) {
      return baseline / candidateSamples[index];
    });
    return median(ratios);
  }

  root.ParserBenchmark = {
    calibrate: calibrate,
    isStable: isStable,
    measure: measure,
    metadataMismatch: metadataMismatch,
    pairedSpeed: pairedSpeed,
    summarize: summarize,
    warm: warm,
  };
})(typeof self === "undefined" ? globalThis : self);
