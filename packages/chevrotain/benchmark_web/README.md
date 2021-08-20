### Benchmark instructions.

1.  `yarn run quick-build` in packages/chevrotain

- This will generate chevrotain.js artifact in the lib directory.

2.  open both index_dev.html and index_latest.html in your prefered browser.

3.  Select the running mode (lex/parse or both) by clicking the relevant button.
    - You should run both scenarios (Dev/Latest) in the same mode
    - You should run the `Latest` mode first as the Dev results are compared against it (via localStorage).
    - It is recommended to run each scenario a **few times** to let the browser JS fully optimize both scenarios.
