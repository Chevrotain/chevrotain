### Benchmark instructions.

1.  `npm run quick-build` in packages/chevrotain

- This will generate chevrotain.js artifact in the lib directory.

2.  open both index_dev.html and index_latest.html

3.  Select the running mode (lex/parse or both) by clicking the relevant button.
    - You should run both scenarios (Dev/Latest) in the same mode
    - You should run the `Latest` mode first as the Dev results are compared against it (via localStorage).
