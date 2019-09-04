const _ = require("lodash")
const vueSlugify = require("vuepress/lib/markdown/slugify")
const jf = require("jsonfile")
const path = require("path")

const packagePath = path.join(__dirname, "../../package.json")
const version = jf.readFileSync(packagePath).version
const versionWithLowDashs = version.replace(/\./g, "_")

const slugMap = {
    "Common Prefix Ambiguities": "COMMON_PREFIX",
    "Ambiguous Alternatives Detected": "AMBIGUOUS_ALTERNATIVES",
    "Terminal Token Name Not Found": "TERMINAL_NAME_NOT_FOUND",
    "Infinite Loop Detected": "INFINITE_LOOP",
    "No LINE_BREAKS Found": "LINE_BREAKS",
    "Unexpected RegExp Anchor Error": "ANCHORS",
    "Token can never be matched": "UNREACHABLE",
    "Complement Sets cannot be automatically optimized": "COMPLEMENT",
    "Failed parsing < /.../ > Using the regexp-to-ast library":
        "REGEXP_PARSING",
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
    "Unable to identify line terminator usage in pattern":
        "IDENTIFY_TERMINATOR",
    "A Custom Token Pattern should specify the <line_breaks> option":
        "CUSTOM_LINE_BREAK",
    "Missing <lineTerminatorCharacters> property on the Lexer config":
        "MISSING_LINE_TERM_CHARS"
}

const slugMapUsed = _.mapValues(slugMap, () => false)

module.exports = {
    title: "Chevrotain",
    base: "/chevrotain/docs/",
    description: "Parser Building Toolkit for JavaScript",
    markdown: {
        slugify: function(str) {
            const mappedSlug = slugMap[str]
            if (mappedSlug) {
                // TODO: can we test all mappings have been used?
                slugMapUsed[str] = true
                return mappedSlug
            }

            return vueSlugify(str)
        }
    },
    themeConfig: {
        repo: "SAP/chevrotain",
        docsDir: "packages/chevrotain/docs",
        docsBranch: "master",
        algolia: {
            apiKey: "3f49ee33a1bc4d674ff8c03ab99c3c1e",
            indexName: "sap_chevrotain"
        },
        editLinks: true,
        editLinkText: "Edit this page on GitHub",
        nav: [
            { text: "Home", link: "/" },
            { text: "Features", link: "/features/blazing_fast" },
            { text: "Tutorial", link: "/tutorial/step0_introduction" },
            { text: "Guide", link: "/guide/introduction" },

            { text: "FAQ", link: "/FAQ" },
            { text: "Changes", link: "/changes/BREAKING_CHANGES" },

            {
                text: "APIs",
                link: `https://sap.github.io/chevrotain/documentation/${versionWithLowDashs}/globals.html`
            },
            {
                text: "Playground",
                link: "https://sap.github.io/chevrotain/playground/"
            },
            {
                text: "Benchmark",
                link: "https://sap.github.io/chevrotain/performance/"
            },
            {
                text: "Chat",
                link: "https://gitter.im/chevrotain-parser/Lobby"
            }
        ],
        sidebar: {
            "/tutorial/": [
                {
                    title: "Tutorial",
                    collapsable: false,
                    children: [
                        // "",
                        ["step0_introduction", "Introduction"],
                        ["step1_lexing", "Lexer"],
                        ["step2_parsing", "Parser"],
                        ["step3_adding_actions_root", "Semantics"],
                        [
                            "step3a_adding_actions_visitor",
                            "Semantics - CST Visitor"
                        ],
                        [
                            "step3b_adding_actions_embedded",
                            "Semantics - Embedded"
                        ],
                        ["step4_fault_tolerance", "Fault Tolerance"]
                    ]
                }
            ],
            "/guide/": [
                {
                    title: "Guide",
                    collapsable: false,
                    children: [
                        ["introduction", "Introduction"],
                        ["performance", "Performance"],
                        ["concrete_syntax_tree", "CST"],
                        ["generating_syntax_diagrams", "Syntax Diagrams"],
                        ["custom_token_patterns", "Custom Token Patterns"],
                        [
                            "syntactic_content_assist",
                            "Syntactic Content Assist"
                        ],
                        ["internals", "Internals"],
                        ["custom_apis", "Custom APIs"],
                        [
                            "resolving_grammar_errors",
                            "Resolving Grammar Errors"
                        ],
                        ["resolving_lexer_errors", "Resolving Lexer Errors"]
                    ]
                }
            ],
            "/features/": [
                {
                    title: "Features",
                    collapsable: false,
                    children: [
                        ["blazing_fast", "Blazing Fast"],
                        ["llk", "LL(K) Grammars"],
                        ["separation", "Separation of Grammar and Semantics"],
                        ["easy_debugging", "Easy Debugging"],
                        ["fault_tolerance", "Fault Tolerance"],
                        ["multiple_start_rules", "Multiple Start Rules"],
                        ["custom_errors", "Customizable Error Messages"],
                        ["parameterized_rules", "Parameterized Rules"],
                        ["gates", "Gates"],
                        [
                            "syntactic_content_assist",
                            "Syntactic Content Assist"
                        ],
                        ["grammar_inheritance", "Grammar Inheritance"],
                        ["backtracking", "Backtracking"],
                        ["syntax_diagrams", "Syntax Diagrams"],
                        ["regexp", "RegExp Based Lexers"],
                        ["position_tracking", "Position Tracking"],
                        [
                            "token_alternative_matches",
                            "Token Alternative Matches"
                        ],
                        ["token_skipping", "Token Skipping"],
                        ["token_categories", "Token Categories"],
                        ["token_grouping", "Token Grouping"],
                        ["custom_token_patterns", "Custom Token Patterns"],
                        ["lexer_modes", "Lexer Modes"]
                    ]
                }
            ],
            "/changes/": [
                {
                    title: "Changes",
                    collapsable: false,
                    children: [
                        ["BREAKING_CHANGES", "Breaking Changes"],
                        ["CHANGELOG", "ChangeLog"]
                    ]
                }
            ]
        }
    }
}
