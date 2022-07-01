### CPU Benchmark

## Background

This benchmark compares the **Current** (latest released version)
With the **Next** version (locally built version on current branch).

## Instructions

1.  `pnpm ci` in the root of this repo.

- This will generate `chevrotain.js` artifact in the lib directory.

2. open `index_current.html` in a browser

   - The **Current** flow has to run first because it saves the benchmark results to the browser's localStorage.
     These results will be used to calculate the **relative** results of **Next** versus **Current**.

3. Choose the scenario (Lexer only / Parser Only / Both).

4. Execute the benchmark scenario several times

   - JS Engines, hotspots optimizations can slightly improve the results on concurrent runs.

5. **Close** the `index_current.html` browser window.

   - This sounds a little strange, but closing the window seems to prevent random strange results.
     Perhaps there is some shared state inside some ECMAScript engines that is affecting the hot-spot optimization?

6. open `index_next.html` in a browser

7. Execute the benchmark several times.

   - JS Engines, hotspots optimizations can slightly improve the results on concurrent runs.

8. Inspect the `Relative Speed` column in `index_next.html`, e.g:
   - If it is 105%, there is likely a small performance improvement.
   - If it is 80% there is a large performance regression.

## Tips and Tricks

### Choose the "right" scenario - Lexer vs Parser vs Both

Choosing the right scenario can emphasize the performance difference and focus the benchmark
on a specific part of the whole parsing process. For example:

- If there has been changes to the parsing engine, but no changes to the lexer engine, the `Parser Only` scenario
  may be most appropriate.

Note that the ECMA5 Grammar does not use a Chevrotain Lexer in its implementation.
This means lexer scenario results from ECMA5 are not relevant and no conclusions should be drawn from those.

### Choose the "right" scenario - CST Output

The `parserConfig` for either mode (current/next) can be configured in [options.js](./parsers/options.js).
The `outputCst` flag can have a large impact on the performance results, so care should be taken
to activate it when changes have been made to CST building scenarios and **de**-activating it
when trying to emphasize the performance impact of other changes in the parsing engine.

### The definition of `Current` mode should not be "static"

It is often convenient and even (mostly) correct to test again the latest **released** version.
However, if there have been many changes since the last release it may more chance to compare between
the master branch and the new upcoming changes.

This can be accomplished by building and bundling `chevrotain.js` from master
and the modifying [options.js](./parsers/options.js) so the "current" mode will load
the locally built bundle instead of the last one released to npmjs (via unpkg.com).

Note that when switching

### Quick-Building

There is a `quick-build` script in the chevrotain sub-package.
It can be used to quickly compile and bundle this sub-package (create `lib/chevrotain.js`) and thus iterate
on performance inspections more quickly.

However, this script is a legacy from before this project was re-structured into a mono-repo.
So it does not take into account the (possible) need to re-build other sub-packages in this mono-repo.
So **use with care**.
