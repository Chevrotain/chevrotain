# Content Assist Examples

This demonstrates two very different ways to implement content assist.

*   [**Official Feature** Using a Chevrotain **computeContentAssist** API that runs an interpreted parser.](official_feature_content_assist.js)

*   [**Experimental**: Augmenting an existing parser flow by overriding internal Chevrotain methods.](experimental_content_assist_in_parser_flow.js)

It is recommended to use and expand upon the **official** Chevrotain **computeContentAssist** API for **productive**
content assist purposes. The Experimental example only exists to be used as a basis to build upon if the limitations of the official API
cannot be worked around in specific use cases.

For farther details, see: [in-depth documentation on Content Assist](../../../docs/02_deep_dive/syntactic_content_assist.md).
