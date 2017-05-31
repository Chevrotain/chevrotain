
### commands to build the grammars

../../../node_modules/.bin/nearleyc json_grammar.ne -o nearley_json_parser.js -e nearley_parser

../../../node_modules/.bin/nearleyc json_grammar_tokenizer.ne -o nearley_json_parser_tokenizer.js -e nearley_parser
