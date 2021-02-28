module.exports = {
  // Common settings for JS Files.
  extends: ["plugin:eslint-comments/recommended", "prettier"],
  env: {
    es6: true,
    commonjs: true,
    mocha: true,
    node: true
  },
  globals: {
    expect: true,
    define: true,
    window: true
  },
  rules: {
    "eslint-comments/require-description": ["error", { ignore: [] }]
  },
  overrides: [
    {
      // For pure-java script sub-packages and general scripts (in any package).
      files: ["*.js"],
      extends: ["eslint:recommended"],
      excludedFiles: [
        "**/vendor/**/*.js",
        "**/diagrams/**/*.js",
        "**/benchmark_web/**/*.js"
      ],
      parserOptions: {
        // The `ecmaVersion` should align to the supported features of our target runtimes (browsers / nodejs / others)
        // Consult with: https://kangax.github.io/compat-table/es2016plus/
        ecmaVersion: 2017
      },
      rules: {
        // conflicts with some prettier settings in UMD sources.
        "no-extra-semi": "off"
      }
    },
    {
      // For sub-packages using TypeScript (libraries/VSCode Exts) && TypeScript definitions (d.ts)
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        // project: ["./tsconfig.base.json", "./tsconfig.json"],
      },
      extends: [
        "plugin:@typescript-eslint/eslint-recommended"
        // "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      rules: {
        "@typescript-eslint/no-use-before-define": [
          "error",
          // These can be safely used before they are defined due to function hoisting in EcmaScript
          { functions: false, classes: false }
        ]
        // TODO: This rule configuration is very useful, attempt to apply it on the existing code base in the future
        // "@typescript-eslint/ban-ts-comment": [
        //   "error",
        //   {
        //     // We only allow ts-expect-error comments to enforce removal
        //     // of outdated suppression comments when the underlying issue has been resolved.
        //     // https://devblogs.microsoft.com/typescript/announcing-typescript-3-9/#what-about-ts-ignore
        //     "ts-expect-error": "allow-with-description",
        //     "ts-ignore": true,
        //     "ts-nocheck": true,
        //     "ts-check": true,
        //   },
        // ],
      }
    }
  ]
}
