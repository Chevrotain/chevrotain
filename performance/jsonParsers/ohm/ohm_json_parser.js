var ohmJsonParser = ohm.grammar(ohmJsonGrammar);

function parse(input) {
    if (ohmJsonParser.match(input).failed()) {
        throw Error("error parsing with Ohm")
    }
}





