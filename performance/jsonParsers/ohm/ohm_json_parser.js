var ohmJsonParser = ohm.grammar(ohmJsonGrammar);

function parse_json_with_ohm(input) {
    if (ohmJsonParser.match(input).failed()) {
        throw Error("error parsing with Ohm")
    }
}





