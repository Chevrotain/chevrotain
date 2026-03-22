/**
 * Sample CSS input for benchmarking (~1K lines).
 * Repetitive AngularJS-style CSS rulesets.
 * Derived from the old benchmark_web/parsers/css/1K_css.js.
 */

const CSS_BLOCK = `
[ng\\:cloak], [ng-cloak], [data-ng-cloak], [x-ng-cloak],
.ng-cloak, .x-ng-cloak,
.ng-hide:not(ng-hide-animate) {
    display: none important;
}

ng\\:form {
    display: block;
}

.ng-animate-shim {
    visibility:hidden;
}

.ng-anchor {
    position:absolute;
}
`;

// Repeat the block ~55 times to create a ~1K-line CSS sample,
// matching the original benchmark_web sample size.
const REPEAT_COUNT = 55;

export const CSS_SAMPLE =
  '@charset "UTF-8";\n' + CSS_BLOCK.repeat(REPEAT_COUNT);
