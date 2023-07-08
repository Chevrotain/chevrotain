## Diagrams

Examples of producing syntax diagrams for a grammar.

- See: [additional documentation](https://chevrotain.io/docs/guide/generating_syntax_diagrams.html)

The grammar is in [grammar.js](./grammar.js).

### Creating a new \*.html file

Run the file below in `node` to generate a `generated_diagrams.html` in this directory

- [creating_html_file.js](./creating_html_file.js)

### Dynamically Rendering the diagrams inside an existing html file

Prerequisite:

- Bundle the grammar by running the `bundle:diagrams` in [parent package.json](../package.json)

- [dynamically_rendering.html](./dynamically_rendering.html)
