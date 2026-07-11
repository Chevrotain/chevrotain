### CPU Benchmark

## Background

This benchmark compares the **latest**
With the **Next** version (locally built version on latest branch).

## Instructions

1. `bun ci` in the root of this repo.

- This generates `packages/chevrotain/lib/chevrotain.mjs`.

2. Serve the repository over HTTP so module workers and local samples can be loaded.

3. Open `index_next.html` in Chromium.

4. Choose and run a scenario.

For `Parser Only`, `index_next.html` creates isolated workers for both the latest release and the local build. It alternates worker-timed batches in the same session and reports the paired relative speed, so a separate `index_latest.html` run is not required.

Parser-only timing includes the supported singleton parser lifecycle:

```javascript
parser.input = cachedTokens;
parser[rootRule]();
```

Lexing, worker messaging, checksums, error inspection, and result rendering are outside the timed interval. Each run validates matching input and token checksums, calibrates batches until worker overhead is below 1%, warms until throughput stabilizes, and collects 25 paired samples. Reproducibility metadata is printed below the results table.

The complete metadata, statistics, and raw samples from the last parser-only run are available as `window.lastParserBenchmarkRecords` in DevTools.

The ECMA5 parser input and Acorn lexer are fetched from versioned unpkg URLs, so ECMA5 runs require network access. The fetched input checksum is included in the benchmark metadata but is not enforced against a predefined value.

For lexer, combined, and initialization scenarios, use the legacy latest-then-next flow:

1. Open `index_latest.html` in a browser.
   - The **latest** flow has to run first because it saves the benchmark results to the browser's localStorage.
     These results will be used to calculate the **relative** results of **Next** versus **latest**.

2. Choose the scenario (Lexer only / Both / initialization).

3. Execute the benchmark scenario several times.
   - JS Engines, hotspot optimizations can slightly improve the results on consecutive runs.

4. **Close** the `index_latest.html` browser window.
   - This sounds a little strange, but closing the window seems to prevent random strange results.
     Perhaps there is some shared state inside some ECMAScript engines that is affecting the hot-spot optimization?

5. Open `index_next.html` in a browser.

6. Execute the benchmark several times.
   - JS Engines, hotspot optimizations can slightly improve the results on consecutive runs.

7. Inspect the `Relative Speed` column in `index_next.html`, e.g:
   - If it is 105%, there is likely a small performance improvement.
   - If it is 80% there is a large performance regression.

## Tips and Tricks

### Choose the "right" scenario - Lexer vs Parser vs Both

Choosing the right scenario can emphasize the performance difference and focus the benchmark
on a specific part of the whole parsing process. For example:

- If there have been changes to the parsing engine, but no changes to the lexer engine, the `Parser Only` scenario
  may be most appropriate.

Note that the ECMA5 Grammar does not use a Chevrotain Lexer in its implementation.
This means lexer scenario results from ECMA5 are not relevant and no conclusions should be drawn from those.

### Choose the "right" scenario - CST Output

The `parserConfig` for either mode (latest/next) can be configured in [options.js](./parsers/options.js).
The `outputCst` flag can have a large impact on the performance results, so care should be taken
to activate it when changes have been made to CST building scenarios and **de**-activating it
when trying to emphasize the performance impact of other changes in the parsing engine.

### The definition of `latest` mode should not be "static"

It is often convenient and even (mostly) correct to test again the latest **released** version.
However, if there have been many changes since the last release, it may have more chance to compare between
the master branch and the new upcoming changes.

This can be accomplished by building and bundling `chevrotain.mjs` from master
and the modifying [options.js](./parsers/options.js) so the "latest" mode will load
the locally built bundle instead of the last one released to npmjs (via unpkg.com).

Note that when switching

### Quick-Building

There is a `quick-build` script in the chevrotain sub-package.
It can be used to quickly compile and bundle this sub-package (create `lib/chevrotain.mjs`) and thus iterate
on performance inspections more quickly.

However, this script is a legacy from before this project was re-structured into a mono-repo.
So it does not take into account the (possible) need to re-build other sub-packages in this mono-repo.
So **use with care**.
