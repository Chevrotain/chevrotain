// remove print-tree dependency
//import $bdjGp$printtree from "print-tree";

var $747425b437e121da$exports = {};
var $e8da1abab4dd59eb$exports = {};
var $71c8e46bee2c32af$exports = {};
const $71c8e46bee2c32af$var$ID_REGEX = new RegExp(/^[A-Za-z_][A-Za-z0-9_]*/);
const $71c8e46bee2c32af$var$COMMENT_REGEXES = [
    new RegExp(/^\/\/[^\n]*/)
];
class $71c8e46bee2c32af$var$Token {
    constructor(type, value, line, col){
        //possible types are: id, string, regex, fn, eof
        this.type = type;
        this.value = value;
        this.line = line;
        this.col = col;
    }
}
class $71c8e46bee2c32af$var$BNFTokenizerError extends Error {
    constructor(msg, line, col){
        super(msg);
        this.name = 'BNFTokenizerError';
        this.message = msg + " @ line: " + line + ", col: " + col;
    }
}
$71c8e46bee2c32af$exports = class Tokenizer {
    constructor(grammar){
        this.source = grammar;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
    }
    error(msg, line, col) {
        return new $71c8e46bee2c32af$var$BNFTokenizerError(msg, line, col);
    }
    advanceChar() {
        const char = this.source.substr(this.pos, 1);
        const ret = [
            char,
            this.line,
            this.col
        ];
        this.pos++;
        if (char === "\n") {
            this.line++;
            this.col = 1;
        } else this.col++;
        return ret;
    }
    getToken() {
        while(true){
            //*************************************************************** comments
            const commentMatch = $71c8e46bee2c32af$var$COMMENT_REGEXES.map((r)=>this.source.substr(this.pos).match(r)).find((r)=>r);
            if (commentMatch) {
                commentMatch[0].split('').forEach((i)=>this.advanceChar());
                continue;
            }
            /*************** read first char ***********/ const [char, line, col] = this.advanceChar();
            /*************** read first char ***********/ //************************************************************* whitespace
            if ([
                "\t",
                " ",
                "\r",
                "\n"
            ].includes(char)) continue;
            //******************************************************************** eof
            if (char === "") return new $71c8e46bee2c32af$var$Token("eof", "", line, col);
            //****************************************************************** regex
            if (char === '~') {
                let buf = "~";
                while(true){
                    let next = this.advanceChar()[0];
                    if (next === "") throw this.error("Regex pattern past end of file.", line, col);
                    if (next === "\\") {
                        next = this.advanceChar()[0];
                        if (next === "") throw this.error("Regex pattern past end of file.", line, col);
                        if (next === '~') {
                            buf += "\~";
                            continue;
                        } else buf += "\\";
                    }
                    if (next === '~') {
                        //TODO: this is problematic. We only check for 'i'. What else could it be?
                        //Read char without affecting line and col. If caseflag exists,
                        //call advance char for "reading" it.
                        const caseFlag = this.source.substr(this.pos, 1) === 'i' ? 'i' : undefined;
                        if (caseFlag) this.advanceChar();
                        try {
                            new RegExp(buf.substr(1), caseFlag);
                        } catch (err) {
                            throw this.error(err, line, col);
                        }
                        buf += "~";
                        if (caseFlag) buf += caseFlag;
                        return new $71c8e46bee2c32af$var$Token("regex", buf, line, col);
                    }
                    buf += next;
                }
            }
            //********************************************************* string literal
            if (char === "'") {
                let buf = '';
                while(true){
                    const delimiter = "'";
                    const next = this.advanceChar()[0];
                    if (next === "") return this.error("String literal past end of file.", line, col);
                    //escape sec:
                    if (delimiter === "'" && next === '\\') {
                        const next = this.advanceChar()[0]; //add to the sequence whatever is escaped
                        if (next === '') return this.error("String literal past end of file.", line, col);
                        buf += next;
                        continue;
                    }
                    if (next === delimiter) return new $71c8e46bee2c32af$var$Token("string", buf, line, col);
                    buf += next;
                }
            }
            //********************************************************** user function
            if (char === '$') {
                const match = this.source.substr(this.pos).match($71c8e46bee2c32af$var$ID_REGEX);
                if (!match) return this.error("Function symbol $ not followed by a valid callback name.");
                for(let i = 0; i < match[0].length; i++)this.advanceChar();
                return new $71c8e46bee2c32af$var$Token("fn", match[0], line, col);
            }
            //****************************************************** control character
            if (";:+*?|()~=!<@".indexOf(char) > -1) return new $71c8e46bee2c32af$var$Token(char, char, line, col);
            //************************************************************* identifier
            //We have already consumed 1 char, take into consideration
            const match = this.source.substr(this.pos - 1).match($71c8e46bee2c32af$var$ID_REGEX);
            if (match) {
                for(let i = 0; i < match[0].length - 1; i++)this.advanceChar();
                return new $71c8e46bee2c32af$var$Token("id", match[0], line, col);
            }
            //************************************************************** exhausted
            throw this.error("Lexical error, no tokens match. Last read char is '" + char + "'", line, col);
        }
    }
};


class $e8da1abab4dd59eb$var$GrammarError extends Error {
    constructor(msg, line, col){
        super(msg);
        this.name = 'GrammarError';
        this.message = msg + " @ line: " + line + ", col: " + col;
    }
}
class $e8da1abab4dd59eb$var$Rule {
    constructor(line, col){
        this.name;
        this.isLexerRule;
        this.alternatives = [];
        this.line = line;
        this.col = col;
    }
}
class $e8da1abab4dd59eb$var$Alternative {
    constructor(){
        this.expressions = [];
        this.predicated = false;
    }
}
class $e8da1abab4dd59eb$var$Exp {
    constructor(type, value, isTerminal, line, col){
        this.type = type;
        this.value = value;
        this.isTerminal = isTerminal;
        this.q; //quantifier
        this.unwanted; //if true, removed from parsed tree.
        this.flatten; //if true, the tokens are appended to the parent rule and the rule is removed.
        this.line = line;
        this.col = col;
    }
}
$e8da1abab4dd59eb$exports = class Parser {
    constructor(src){
        this.src = src;
        this.currentToken = null;
        this.tokenizer = new $71c8e46bee2c32af$exports(src);
        this.rules = {}; //keys are rule names, values are Rule objects
        this.usedRules = {}; //keys are rule names, values are tokens used.
        this.anonymousRuleCount = 0; //to name anonymous rules
    }
    error(msg, line, col) {
        if (line == null) line = this.tokenizer.line;
        if (col == null) col = this.tokenizer.col;
        return new $e8da1abab4dd59eb$var$GrammarError(msg, line, col);
    }
    //Tries to match the currentToken with the type in the argument.
    //If found, consumes it by fetching a new token and returns the token;
    //If match was required and didn't match throw, otherwise return null.
    accept(type, required) {
        if (type === this.currentToken.type) {
            const retval = this.currentToken;
            this.currentToken = this.tokenizer.getToken(); //fill the lookahead
            return retval;
        }
        if (required) throw this.error(`Expected '${type}', but found '${this.currentToken.type}'
        with value '${this.currentToken.value}'.`);
        return null;
    }
    parse() {
        this.currentToken = this.tokenizer.getToken();
        const ret = this.parse_grammar();
        if (!ret) throw this.error("Expected grammar definition.");
        this.accept("eof", true);
        //check if the start rule is defined:
        if (!this.rules["program"]) throw this.error("Start rule 'program' is missing.");
        //check if any undefined rules are used:
        this.checkUndefinedRules();
        //check all rules for left recursion and non terminating rules:
        const rulesArray = Object.values(this.rules);
        rulesArray.forEach((rule)=>this.checkLeftRecursion(rule, {}));
        rulesArray.forEach((rule)=>this.checkEmpty(rule));
        rulesArray.forEach((rule)=>this.checkCommonPrefix(rule, {}, []));
        rulesArray.forEach((rule)=>{
            rule.alternatives.forEach((a)=>{
                if (a.predicated) return;
                a.expressions.forEach((e, i)=>{
                    this.checkCommonFirstSetForAdjacentExpressions(e, i, a.expressions, rule);
                });
            });
        });
        this.checkUnusedRules(); //not an error but a warning:
        //add an eof token at the end of the program:
        const eof = new $e8da1abab4dd59eb$var$Exp("#eof", "", true);
        eof.q = '1';
        for (const alt of this.rules["program"].alternatives)alt.expressions.push(eof);
        return this.rules;
    }
    //common prefix is when any 2 alternatives' first non-predicated
    //terminals are the same. When this happens we cannot find which
    //rule to apply.
    checkCommonPrefix(rule, firsts, path) {
        //collect all non predicated first terminals among all alternatives:
        //firsts = {}; where keys are terminal hashes, values are an array of
        //visited rule names.
        path.push(rule.name);
        for (const alt of rule.alternatives){
            if (alt.predicated) continue;
            for (const exp of alt.expressions){
                if (exp.isTerminal) {
                    const hash = exp.type + ':' + exp.value;
                    if (firsts[hash]) {
                        //find the last common rule among two sets:
                        let commonSets = [];
                        let commonStarts = -1;
                        for(let i = 0; i < path.length; i++)if (path[i] !== firsts[hash][i]) {
                            commonStarts = i;
                            break;
                        }
                        commonStarts = commonStarts <= 0 ? 0 : commonStarts - 1;
                        commonSets.push(firsts[hash].slice(commonStarts));
                        commonSets.push(path.slice(commonStarts));
                        commonSets.forEach((cs)=>cs.push("'" + exp.value + "'"));
                        let err = "Common prefix. Terminal '" + exp.value + "' can be the first terminal for rule '" + commonSets[0][0] + "' in at least 2 occasions. Offending paths are listed below:";
                        err += "\n-------PATH 1-------\n";
                        err += commonSets[0].join("\n");
                        err += "\n\n-------PATH 2-------\n";
                        err += commonSets[1].join("\n") + "\n\n";
                        throw this.error(err, exp.line, exp.col);
                    }
                    firsts[hash] = path.slice(0);
                } else this.checkCommonPrefix(exp.type === 'rule' ? exp.value : this.rules[exp.value], firsts, path);
                //if first non-nullable item passes the test, skip remaining exps.
                if (exp.q === '1' || exp.q === '+') break;
            }
        }
        path.pop();
    }
    setFirstTerminalsOfExp(exp, arr) {
        if (exp.isTerminal) {
            arr.push(exp.type + ':' + exp.value);
            return arr;
        } else {
            const rule = exp.type === 'rule' ? exp.value : this.rules[exp.value];
            rule.alternatives.forEach((a)=>{
                if (a.predicated) return;
                const e = a.expressions[0];
                const ret = this.setFirstTerminalsOfExp(e, arr);
                arr.concat(ret);
            });
            return arr;
        }
    }
    //Following structure fails due to ambiguity. Catch them.
    //A: t? t
    //* and + are also bad as the first expression. (+ is okay as next)
    //TODO: Unfortunately, we currently cannot catch ',' overlap
    //in something like the below example, but maybe we don't need to.
    //'{' (property_assignment (',' property_assignment)* )? ','? '}'
    checkCommonFirstSetForAdjacentExpressions(exp, index, expressions, rule) {
        if (exp.q === '1') return;
        if (index + 1 === expressions.length) return;
        const arr1 = [];
        this.setFirstTerminalsOfExp(exp, arr1);
        let _index = index;
        while(true){
            const next = expressions[++_index];
            if (!next) break;
            const arr2 = [];
            this.setFirstTerminalsOfExp(next, arr2);
            const common = arr1.filter((n)=>arr2.indexOf(n) > -1);
            if (common.length) {
                const msg = "Rule '" + rule.name + "' has expressions that compete to produce terminal '" + common + "'.";
                throw this.error(msg, rule.line, rule.col);
            }
            //ok no overlap. If next is + or 1, break because it cannot "fall through"
            if (next.q === '1' || next.q === '+') break;
        }
    }
    //checks for rules that are in the form: A: B?
    //these can potentially not create any terminals.
    checkEmpty(rule) {
        rule.alternatives.forEach((alt)=>{
            const solid = alt.expressions.find((exp)=>[
                    "1",
                    "+"
                ].includes(exp.q));
            if (!solid) throw this.error("'" + rule.name + "' can possibly produce nothing.", rule.line, rule.col);
        });
    }
    checkUnusedRules() {
        const visitedList = new Set();
        if (this.rules["ignore"]) this.visitUsedRules(this.rules["ignore"], visitedList);
        this.visitUsedRules(this.rules["program"], visitedList);
        const unvisitedList = Object.keys(this.rules).filter((ruleName)=>!visitedList.has(ruleName));
        if (unvisitedList.length) console.warn("Warning. Following rules are unreachable from the 'program': '" + unvisitedList.join(', ') + "'.");
    }
    visitUsedRules(rule, visitedList) {
        if (visitedList.has(rule.name)) return;
        visitedList.add(rule.name);
        for (const alt of rule.alternatives)for (const exp of alt.expressions)if (!exp.isTerminal) this.visitUsedRules(exp.type === 'rule' ? exp.value : this.rules[exp.value], visitedList);
    }
    checkLeftRecursion(rule, visitedList) {
        visitedList[rule.name] = true;
        for (const a of rule.alternatives)for (const e of a.expressions){
            if (!e.isTerminal) {
                if (e.type === 'rule') this.checkLeftRecursion(e.value, visitedList);
                else {
                    if (visitedList[e.value]) throw this.error("Left recursion in rule '" + rule.name + "'", rule.line, rule.col);
                    const r = this.rules[e.value]; //id -> rule
                    this.checkLeftRecursion(r, visitedList);
                    visitedList[r.name] = false; //remove the rules that didn't cause any problem.
                }
            }
            //We found the first non-nullable, no need to check the remaining exps.
            if (e.q === '1' || e.q === '+') break;
        }
    }
    checkUndefinedRules() {
        const undefinedNames = Object.keys(this.usedRules).filter((ruleName)=>!(ruleName in this.rules));
        if (undefinedNames.length) {
            const msg = undefinedNames.map((name)=>{
                return "'" + name + "', on line(s) " + this.usedRules[name].map((token)=>token.line).join(', ');
            }).join("\n");
            throw this.error("Following rule names are used but not defined: \n" + msg + ".");
        }
    }
    /****************************** grammar rules *******************************/ /****************************** grammar rules *******************************/ /****************************** grammar rules *******************************/ parse_grammar() {
        // definition +
        let rule = this.parse_definition();
        if (!rule) return null;
        const rules = [
            rule
        ];
        while(true){
            rule = this.parse_definition();
            if (!rule) break;
            rules.push(rule);
        }
        return rules;
    }
    parse_definition() {
        // identifier (':' | '=') alternatives ';' ;
        const ruleNameToken = this.accept("id", false);
        if (!ruleNameToken) return null;
        const assignmentToken = this.accept(":", false) || this.accept("=", true);
        const ret = this.parse_alternatives();
        if (!ret) throw this.error("Expected alternatives.");
        this.accept(';', true);
        if (this.rules[ruleNameToken.value]) throw this.error(`Duplicate rule: '${ruleNameToken.value}' is defined more than once.`);
        const r = new $e8da1abab4dd59eb$var$Rule(ruleNameToken.line, ruleNameToken.col);
        r.name = ruleNameToken.value;
        r.alternatives = ret;
        r.isLexerRule = assignmentToken.value === '=';
        if (r.isLexerRule) for (const a of ret){
            if (a.expressions.length > 1) throw this.error("Lexer rules can contain only one expression per alternative.");
            if (!a.expressions[0].isTerminal) throw this.error("Lexer rules can contain only terminal definitions.");
            for (const e of a.expressions)if (e.q !== '1') throw this.error("Expression in lexer rules can't have quantifiers outside of regular expressions.");
        }
        /*
    else {
      if (ruleNameToken.value === 'ignore')
        throw this.error("'ignore' is a special name, parser rules can't have that name.");
    }
    */ this.rules[r.name] = r;
        return r;
    }
    parse_alternatives() {
        // alternative ('|' alternative)* ;
        let ret = this.parse_alternative();
        if (!ret) return null;
        const alternatives = [
            ret
        ];
        while(true){
            if (!this.accept("|", false)) break;
            ret = this.parse_alternative();
            if (!ret) throw this.error("Expected alternative.");
            alternatives.push(ret);
        }
        return alternatives;
    }
    parse_alternative() {
        // '@'? ( '<'? '!'? exp quantifier?)+ ;
        let predicated = !!this.accept("@", false);
        let flatten = !!this.accept("<", false);
        let unwanted = !!this.accept('!', false);
        let exp = this.parse_exp();
        if (!exp) return null;
        exp.q = this.parse_quantifier() || '1';
        exp.unwanted = unwanted;
        exp.flatten = flatten;
        //if (exp.isTerminal && exp.q !== '1') throw this.error("Terminals can't have quantifiers.");
        if (exp.isTerminal && exp.flatten) throw this.error("Terminals can't be flattened with '<'.");
        const expressions = [
            exp
        ];
        while(true){
            flatten = !!this.accept("<", false);
            unwanted = !!this.accept('!', false);
            exp = this.parse_exp();
            if (!exp) break;
            exp.q = this.parse_quantifier() || '1';
            exp.unwanted = unwanted;
            exp.flatten = flatten;
            //if (exp.isTerminal && exp.q !== '1') throw this.error("Terminals can't have quantifiers.");
            if (exp.isTerminal && exp.flatten) throw this.error("Terminals can't be flattened with '<'.");
            expressions.push(exp);
        }
        const a = new $e8da1abab4dd59eb$var$Alternative();
        a.predicated = predicated;
        a.expressions = expressions;
        return a;
    }
    parse_exp() {
        // identifier | string | regex | fn
        // | '(' alternatives ')' ( '=' identifier )?
        //first 4 are processed the same, except identifier is non-terminal
        for (const type of [
            "id",
            "regex",
            "string",
            "fn"
        ]){
            const token = this.accept(type, false);
            if (token) {
                //add id to the used rules as we will need to check unused/overused rules
                if (type === 'id') {
                    if (!this.usedRules[token.value]) this.usedRules[token.value] = [];
                    this.usedRules[token.value].push(token);
                }
                return new $e8da1abab4dd59eb$var$Exp(type, token.value, type !== 'id', token.line, token.col);
            }
        }
        //'(' alternatives ')' ( '=' identifier )?
        //we simply create a new rule from the parenthetical expression.
        const ruleStartToken = this.accept('(', false);
        if (!ruleStartToken) return null;
        const alternatives = this.parse_alternatives();
        if (!alternatives) throw this.error("Expected alternatives.");
        this.accept(")", true);
        const r = new $e8da1abab4dd59eb$var$Rule(ruleStartToken.line, ruleStartToken.col);
        r.alternatives = alternatives;
        r.isLexerRule = false;
        //set the name. if renamed use, otherwise create anonymous rule name.
        r.name = !this.accept("=", false) ? `anonymous-rule#${this.anonymousRuleCount++}` : this.accept("id", true).value;
        if (this.rules[r.name]) throw this.error(`Duplicate rule: '${r.name}' is defined more than once.`);
        this.rules[r.name] = r;
        return new $e8da1abab4dd59eb$var$Exp("rule", r, false, r.line, r.col);
    }
    parse_quantifier() {
        // '?' | '*' | '+'
        const ret = [
            "?",
            "*",
            "+"
        ].map((q)=>this.accept(q, false)).find((q)=>q);
        return ret ? ret.value : null;
    }
};


var $de29032e046980a7$exports = {};
//https://wincent.com/wiki/ANTLR_predicates

class $de29032e046980a7$var$Token {
    constructor(type, value, src, line, col){
        this.type = type; //regex, string, fn, #eof
        this.value = value; //value of regex or string, '' for #eof, callback for fn
        this.src = src; //original regex or string used to match. '' for #eof.
        this.line = line;
        this.col = col;
    }
}
class $de29032e046980a7$var$Rule {
    constructor(name){
        this.name = name;
        this.tokens = [];
        //this.basedOnToken; //for lexer tokens
        this.isLexerRule = false;
        this.value; //for lexer tokens
    }
    getNodeType() {
        return "Rule";
    }
}
class $de29032e046980a7$var$ParserException extends Error {
    constructor(msg, line, col){
        super(msg);
        this.message = msg + " @ line: " + line + ", col: " + col;
    }
}
$de29032e046980a7$exports = class Parser {
    constructor(rules, source, options){
        this.options = Object.assign({
            trim: false,
            notrim: [],
            exclude: [],
            accept: null
        }, options || {});
        this.rules = rules;
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.curToken = null; //stack of all tokens in the program.
        this.tokens = []; //token stack.
        this.tokenPointer = -1; //stats with ++
        //predicateLevel increased when @ is seen, decreased when the alternative
        //containing @ succeeds. If > 0 and a follow list fails, alternative is
        //abandoned instead of throwing an error.
        this.predicateLevel = 0;
        //custom lexer methods. keys are method names, values are callbacks in the
        //form of
        this.registeredLexerMethods = {};
        //terminals of the grammar, not the program. to be filled from the grammar file.
        const terminals = this.separateLexerRules(Object.values(this.rules), {});
        this.terminals = Object.values(terminals);
    }
    separateLexerRules(rules, terminals) {
        rules.forEach((rule)=>{
            rule.alternatives.forEach((alt)=>{
                alt.expressions.filter((exp)=>exp.isTerminal).forEach((exp)=>{
                    const hash = exp.type + ":" + exp.value;
                    terminals[hash] = {
                        type: exp.type,
                        value: exp.value
                    };
                    //mark the ignore terminals as such:
                    if (rule.name === 'ignore') terminals[hash].isIgnore = true;
                });
                //also process terminals that are hidden in unnamed rules (exp rules):
                const expRules = alt.expressions.filter((exp)=>exp.type === 'rule').map((exp)=>exp.value);
                this.separateLexerRules(expRules, terminals);
            });
        });
        return terminals;
    }
    error(msg, line, col) {
        if (line == undefined) line = this.line;
        if (col === undefined) col = this.col;
        return new $de29032e046980a7$var$ParserException(msg, line, col);
    }
    parse() {
        //read all tokens in the source first. If errs occur, we better
        //know here. Also, due to backtracking, we need to go back to a consumed
        //token, therefore token list is implemented as a stack.
        let token;
        do {
            token = this.getToken();
            this.tokens.push(token);
        }while (token.type !== '#eof');
        /*
    //combine the lexer rules with parser rules
    for (var ruleName in this.lexerRules)
      this.rules[ruleName] = this.lexerRules[ruleName];
    */ this.getSym(); //put one lookahead token up.
        this.program = this.drive(this.rules["program"], true);
        return this.program;
    }
    getSym() {
        return this.curToken = this.tokens[++this.tokenPointer];
    }
    setSym(pointer) {
        this.tokenPointer = pointer;
        return this.curToken = this.tokens[this.tokenPointer];
    }
    //tries to match a terminal token, by type and value. then consumes it.
    accept(type, value, mustMatch) {
        if (type === this.curToken.type && value === this.curToken.src) {
            const retval = this.curToken;
            this.getSym(); //fill the lookahead
            if (this.options.accept) this.options.accept(retval);
            return retval;
        }
        if (mustMatch) throw this.error(`Expected '${type}', but found '${this.curToken.type}'
        with value '${this.curToken.value}'.`, this.curToken.line, this.curToken.col);
    }
    prepareNode(rule, exp, node) {
        if (exp.unwanted) return; //don't add unwanted tokens
        if (exp.isTerminal) {
            if (typeof this.options.exclude === 'function') {
                if (this.options.exclude(exp)) return;
            } else {
                if (this.options.exclude.includes(exp.value)) return;
            }
        }
        if (!exp.flatten) rule.tokens.push(node);
        else rule.tokens = rule.tokens.concat(node.tokens);
    }
    lexerRulifyRule(rule, token) {
        rule.value = token.value;
        //rule.basedOnToken = token;
        rule.isLexerRule = true;
    }
    drive(baseRule, mustMatch) {
        //var base = this.rules[ruleName];
        const rule = new $de29032e046980a7$var$Rule(baseRule.name);
        //loop the alternatives. first exp that match assumes the alteranative
        //is found unless alt is predicated. If alternative has a predicate,
        //failing to match a required exp in the follow list is not an error.
        for (const alt of baseRule.alternatives){
            let alternativeFound = false;
            if (alt.predicated) this.predicateLevel++;
            const tokenPointer = this.tokenPointer; //back up, in case restore needed.
            //loop the expressions.
            //if an expression matches, all the remaining ones must match,
            //meaning that alternative worked, or the alternative is discarded.
            for (const exp of alt.expressions){
                //expMustMatch=true signifies that we already found the path, so not
                //matching an expression is an error and must throw unless predicated.
                const expMustMatch = !this.predicateLevel && alternativeFound && (exp.q === '1' || exp.q === '+');
                let ret = this.makeCall(exp, expMustMatch);
                if (ret) {
                    alternativeFound = true;
                    baseRule.isLexerRule ? this.lexerRulifyRule(rule, ret) : this.prepareNode(rule, exp, ret);
                } else {
                    //if this expression is optional continue with the remaining exps.
                    if (exp.q === '?' || exp.q === '*') continue;
                    //ok, exp was required and not found, so abandon the alternative.
                    //execution comes here when alt is predicated so makeCall didn't throw.
                    alternativeFound = false;
                    break;
                }
                //common in both initial and follow: loops.
                //try the exp as long as it matches.
                if (alternativeFound && (exp.q === '+' || exp.q === '*')) while(true){
                    ret = this.makeCall(exp, false);
                    if (!ret) break;
                    this.prepareNode(rule, exp, ret);
                }
            }
            //alternatives continue.
            if (alt.predicated) this.predicateLevel--;
            if (alternativeFound) {
                //Experimental trim functions from the old php code.
                //if (rule.tokens.length === 1 && rule.tokens[0] instanceof Rule) return rule.tokens[0];
                //if (rule.tokens.length === 1) return rule.tokens[0];
                //if (rule.tokens.every(t => t instanceof Token)) return rule;
                const skip = this.options.trim && rule.tokens.length === 1 && !this.options.notrim.includes(rule.name) && rule.tokens[0] instanceof $de29032e046980a7$var$Rule && !rule.tokens[0].isLexerRule;
                if (skip) return rule.tokens[0];
                return rule;
            } else {
                //alternative is not found.
                //If the alt failed due to a predicate, that means we read some tokens
                //from the tokenStack and pushed them into the rule's tokens.
                //Now we have to reset them here so that next alternative can make a
                //clean start.
                rule.tokens = [];
                //reset the stack to where it was before the alternative had been attempted.
                this.setSym(tokenPointer);
            }
        }
        //no alternatives matched while the rule was required:
        if (mustMatch) {
            var msg = `Expected '${baseRule.name}' but not found. Last terminal read is a` + ` '${this.curToken.type}' with value '${this.curToken.value}'.`;
            throw this.error(msg, this.curToken.line, this.curToken.col);
        }
    }
    //makeCall simulates a call to a rule definition or accepting a token in a
    //recursive descent parser had we been generating code.
    makeCall(exp, mustMatch) {
        switch(exp.type){
            case 'string':
            case 'regex':
            case 'fn':
                return this.accept(exp.type, exp.value, mustMatch);
            case 'id':
                const rule = this.rules[exp.value];
                return this.drive(rule, mustMatch);
            case '#eof':
                return this.accept('#eof', '', mustMatch);
            case 'rule':
                return this.drive(exp.value, mustMatch);
            default:
                //this can't really happen but still...
                throw new Error("Some internal error occured. An expression with a different type than the grammar analyser can produce found. ");
        }
    }
    /**************************** TOKENIZER ***************************/ /**************************** TOKENIZER ***************************/ /**************************** TOKENIZER ***************************/ registerLexerMethod(ruleName, method) {
        this.registeredLexerMethods[ruleName] = method;
    }
    createToken(t) {
        const token = new $de29032e046980a7$var$Token(t.type, t.value, t.src, this.line, this.col);
        //adjust col, pos and line:
        //registered lexers may return length field, cater that.
        const len = t.length == undefined ? t.value.length : t.length;
        for(let i = 0; i < len; i++)if (t.value[i] === "\n") {
            this.col = 1;
            this.line++;
        } else this.col++;
        this.pos += len;
        //After the adjustment, we consume ignore tokens internally and never return them.
        if (t.isIgnore) return this.getToken();
        return token;
    }
    //tries to match the input against all of te lexer rules and returns the
    //longest one. Not matching anything is lexical error.
    getToken() {
        const source = this.source.substr(this.pos);
        if (source === '') return this.createToken({
            type: "#eof",
            src: '',
            value: ''
        });
        const matches = [];
        for (const term of this.terminals){
            if (term.type === 'string') {
                if (source.startsWith(term.value)) matches.push({
                    type: term.type,
                    src: term.value,
                    value: term.value,
                    isIgnore: term.isIgnore
                });
            } else if (term.type === 'regex') {
                const parts = term.value.split('~');
                const flag = parts.pop() === 'i' ? 'i' : undefined;
                parts.shift();
                const pattern = "^" + parts.join('~');
                if (source.search(pattern, flag) === 0) matches.push({
                    type: term.type,
                    src: term.value,
                    value: new RegExp(pattern, flag).exec(source)[0],
                    isIgnore: term.isIgnore
                });
            } else if (term.type === 'fn') {
                const method = this.registeredLexerMethods[term.value];
                if (!method || typeof method !== 'function') throw this.error("Lexer method named '" + term.value + "' is not registered or is not a function.");
                const ret = method(this.source.substr(this.pos));
                if (ret == null) continue;
                if (typeof ret === 'string') matches.push({
                    type: term.type,
                    src: term.value,
                    value: ret
                });
                else if (typeof ret === 'object') matches.push({
                    type: term.type,
                    src: term.value,
                    value: ret.value,
                    length: ret.length
                });
            }
        }
        if (!matches.length) throw this.error("Lexical error: input stream did not match any tokens. '" + source[0] + "'(chr: " + source.charCodeAt(0) + ") is the first character that is not recognized.");
        //among all the matches, return the longest one.
        //http://stackoverflow.com/questions/6521245/finding-longest-string-in-array/12548884#12548884
        //modified so that first among the equal length is chosen.
        const longest = matches.reduce((a, b)=>a.value.length >= b.value.length ? a : b);
        return this.createToken(longest);
    }
    /********************************* UTILS *********************************/ /********************************* UTILS *********************************/ /********************************* UTILS *********************************/
/*
    static print(rule) {
        //const printTree = require('print-tree');
        (0, $bdjGp$printtree)(rule, (node)=>{
            const isTerm = node instanceof $de29032e046980a7$var$Token || node.isLexerRule;
            const extra = isTerm ? ': ' + node.value : '';
            const name = node instanceof $de29032e046980a7$var$Token ? node.type : node.name;
            return name + extra;
        }, (node)=>node.tokens);
    }
*/
    static walk(rule, cb) {
        if (cb.enter) cb.enter(rule);
        if (Array.isArray(rule.tokens)) rule.tokens.forEach((t)=>Parser.walk(t, cb));
        if (cb.exit) cb.exit(rule);
    }
/*
    print(rule) {
        Parser.print(rule);
    }
*/
    walk(rule, cb) {
        Parser.walk(rule, cb);
    }
};


$747425b437e121da$exports = {
    BNFParser: $e8da1abab4dd59eb$exports,
    Parser: $de29032e046980a7$exports,
    bnfParse (grammar) {
        const bnfParser = new $e8da1abab4dd59eb$exports(grammar);
        return bnfParser.parse();
    },
    createParser (rules, program, options) {
        return new $de29032e046980a7$exports(rules, program, options);
    },
    parse (rules, program, options) {
        const parser = new $de29032e046980a7$exports(rules, program, options);
        return parser.parse();
    },
    registerLexerMethod (parser, ruleName, method) {
        return parser.registerLexerMethod(ruleName, method);
    },
/*
    print (node) {
        return $de29032e046980a7$exports.print(node);
    },
*/
    walk (node, callbacks) {
        return $de29032e046980a7$exports.walk(node, callbacks);
    }
};


export { $e8da1abab4dd59eb$exports as BNFParser, $de29032e046980a7$exports as Parser };
