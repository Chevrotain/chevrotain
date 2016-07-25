
### commands to build the grammars

nearleyc json_grammar.ne -o nearley_json_parser.js -e nearley_parser

nearleyc json_grammar_tokenizer.ne -o nearley_json_parser_tokenizer.js -e nearley_parser
