const { mapValues } = require("remeda")
const { slugify } = require("@mdit-vue/shared")
const { defaultTheme } = require("@vuepress/theme-default")
const { docsearchPlugin } = require("@vuepress/plugin-docsearch")
const jf = require("jsonfile")
const path = require("path")

const packagePath = path.join(__dirname, "../../package.json")
const version = jf.readFileSync(packagePath).version
const versionWithLowDashs = version.replace(/\./g, "_")

const slugMap = {
  "Common Prefix Ambiguities": "COMMON_PREFIX",
  "Ambiguous Alternatives Detected": "AMBIGUOUS_ALTERNATIVES",
  "Ignoring Ambiguities": "IGNORING_AMBIGUITIES",
  "Terminal Token Name Not Found": "TERMINAL_NAME_NOT_FOUND",
  "Infinite Loop Detected": "INFINITE_LOOP",
  "No LINE_BREAKS Found": "LINE_BREAKS",
  "Unexpected RegExp Anchor Error": "ANCHORS",
  "Token can never be matched": "UNREACHABLE",
  "Complement Sets cannot be automatically optimized": "COMPLEMENT",
  "Failed parsing < /.../ > Using the regexp-to-ast library": "REGEXP_PARSING",
  "The regexp unicode flag is not currently supported by the regexp-to-ast library":
    "UNICODE_OPTIMIZE",
  "TokenType <...> is using a custom token pattern without providing <char_start_hint> parameter":
    "CUSTOM_OPTIMIZE",
  "Why should I use a Parsing DSL instead of a Parser Generator?":
    "VS_GENERATORS",
  "What Differentiates Chevrotain from other JavaScript Parsing Solutions?":
    "VS_OTHERS",
  "Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?":
    "WHY_ERROR_RECOVERY",
  "How do I debug my parser?": "DEBUGGING",
  "Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?":
    "NUMERICAL_SUFFIXES",
  "Why does Chevrotain not work correctly after I minified my Grammar?":
    "MINIFIED",
  "Why does Chevrotain not work correctly after I webpacked my Grammar?":
    "WEBPACK",
  "Why does my parser appear to be stuck during its initialization?":
    "STUCK_AMBIGUITY",
  "Unable to identify line terminator usage in pattern": "IDENTIFY_TERMINATOR",
  "A Custom Token Pattern should specify the <line_breaks> option":
    "CUSTOM_LINE_BREAK",
  "Missing <lineTerminatorCharacters> property on the Lexer config":
    "MISSING_LINE_TERM_CHARS"
}

const slugMapUsed = mapValues(slugMap, () => false)

module.exports = {
  title: "Chevrotain",
  base: "/docs/",
  description: "Parser Building Toolkit for JavaScript",
  markdown: {
    slugify: function (str) {
      const mappedSlug = slugMap[str]
      if (mappedSlug) {
        // TODO: can we test all mappings have been used?
        slugMapUsed[str] = true
        return mappedSlug
      }

      return slugify(str)
    }
  },
  plugins: [
    docsearchPlugin({
      apiKey: "512c3a75c3c7e55f583e8e9c5f131066",
      indexName: "sap_chevrotain",
      appId: "J7Q8R9M5PG"
    })
  ],
  theme: defaultTheme({
    repo: "chevrotain/chevrotain",
    docsDir: "packages/website/docs",
    docsBranch: "master",
    editLinks: true,
    editLinkText: "Edit this page on GitHub",
    navbar: [
      { text: "Home", link: "/" },
      { text: "Features", link: "/features/blazing_fast" },
      { text: "Tutorial", link: "/tutorial/step0_introduction" },
      { text: "Guide", link: "/guide/introduction" },

      { text: "FAQ", link: "/FAQ" },
      { text: "Changes", link: "/changes/BREAKING_CHANGES" },

      {
        text: "APIs",
        link: `https://chevrotain.io/documentation/${versionWithLowDashs}/modules.html`
      },
      {
        text: "Playground",
        link: "https://chevrotain.io/playground/"
      },
      {
        text: "Benchmark",
        link: "https://chevrotain.io/performance/"
      },
      {
        text: "Discussions",
        link: "https://github.com/Chevrotain/chevrotain/discussions"
      }
    ],
    sidebar: {
      "/tutorial/": [
        {
          text: "Tutorial",
          collapsable: false,
          children: [
            "/tutorial/step0_introduction.md",
            "/tutorial/step1_lexing.md",
            "/tutorial/step2_parsing.md",
            "/tutorial/step3_adding_actions_root.md",
            "/tutorial/step3a_adding_actions_visitor.md",
            "/tutorial/step3b_adding_actions_embedded.md",
            "/tutorial/step4_fault_tolerance.md"
          ]
        }
      ],
      "/guide/": [
        {
          text: "Guide",
          collapsable: false,
          children: [
            "/guide/introduction.md",
            "/guide/performance.md",
            "/guide/initialization_performance.md",
            "/guide/concrete_syntax_tree.md",
            "/guide/generating_syntax_diagrams.md",
            "/guide/custom_token_patterns.md",
            "/guide/syntactic_content_assist.md",
            "/guide/internals.md",
            "/guide/resolving_grammar_errors.md",
            "/guide/resolving_lexer_errors.md"
          ]
        }
      ],
      "/features/": [
        {
          text: "Features",
          collapsable: false,
          children: [
            "/features/blazing_fast.md",
            "/features/llk.md",
            "/features/separation.md",
            "/features/easy_debugging.md",
            "/features/fault_tolerance.md",
            "/features/multiple_start_rules.md",
            "/features/custom_errors.md",
            "/features/parameterized_rules.md",
            "/features/gates.md",
            "/features/syntactic_content_assist.md",
            "/features/grammar_inheritance.md",
            "/features/backtracking.md",
            "/features/syntax_diagrams.md",
            "/features/regexp.md",
            "/features/position_tracking.md",
            "/features/token_alternative_matches.md",
            "/features/token_skipping.md",
            "/features/token_categories.md",
            "/features/token_grouping.md",
            "/features/custom_token_patterns.md",
            "/features/lexer_modes.md"
          ]
        }
      ],
      "/changes/": [
        {
          text: "Changes",
          collapsable: false,
          children: ["/changes/BREAKING_CHANGES.md", "/changes/CHANGELOG.md"]
        }
      ]
    }
  })
}
