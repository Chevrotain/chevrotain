# Syntax Diagrams

It is often useful to visually inspect a grammar's syntax diagrams during development
or for documentation purposes.

This document contains instructions on how to generate Syntax railroad diagrams for a Chevrotain
grammar using the [railroad-diagrams](https://github.com/tabatkins/railroad-diagrams)
library by @tabatkins.

## Examples

- [JSON Syntax diagrams](https://chevrotain.io/diagrams_samples/json.html).
- [CSS Syntax diagrams](https://chevrotain.io/diagrams_samples/css.html).

## Features

- Highlight usages and definitions on mouse hover.
- Scroll to definition of non-terminal on mouse click.

## Instructions

Chevrotain provides the [**createSyntaxDiagramsCode**](https://chevrotain.io/documentation/11_1_2/modules.html#createsyntaxdiagramscode) API to generate the **HTML source code**
of syntax diagrams. This HTML source code can then be used by an end user in either Node.js or a browser:

1.  By writing it directly to the disk in a pure Node.js runtime scenario.
2.  By inserting it dynamically into an iframe in a browser scenario.

**Examples:**

- [Generating syntax diagrams to a file](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/diagrams/creating_html_file.js)
  - Self-contained, no need for Chevrotain or the grammar when rendering the HTML.

- [Generating syntax diagrams dynamically into an iframe](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/diagrams/diagrams_browser.html)
  - Requires loading **both** Chevrotain and the grammar (and dependencies!) when rendering the HTML.

## Customization

The [logic for generating the HTML](https://github.com/Chevrotain/chevrotain/blob/master/packages/chevrotain/src/diagrams/render_public.ts)
is quite trivial and the generated code itself is also very simple with a decent separation of concerns.
These can be used as a basis for creating more advanced custom scenarios, for example:

- Adding a module loader such as system.js/require.js.
- Dynamically rendering diagrams of a grammar in an IDE.
- Rendering diagrams of a pure EBNF grammar (not a Chevrotain grammar), as the diagrams are rendered
  using a serialized format.
