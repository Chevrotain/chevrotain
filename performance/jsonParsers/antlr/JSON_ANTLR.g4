/** Taken from "The Definitive ANTLR 4 Reference" by Terence Parr */
// original source from: https://github.com/antlr/grammars-v4/blob/master/json/JSON.g4
// Derived from http://json.org

grammar JSON_ANTLR;

json:   object
    |   array
    ;

object
    :   '{' pair (',' pair)* '}'
    |   '{' '}' // empty object
    ;
    
pair:   STRING ':' value ;

array
    :   '[' value (',' value)* ']'
    |   '[' ']' // empty array
    ;

value
    :   STRING
    |   NUMBER
    |   object  // recursion
    |   array   // recursion
    |   'true'  // keywords
    |   'false'
    |   'null'
    ;

WS  :   [ \t\n\r]+ -> skip ;

STRING :  '"' (ESC | ~["\\])* '"' ;

fragment ESC :   '\\' (["\\/bfnrt] | UNICODE) ;
fragment UNICODE : 'u' HEX HEX HEX HEX ;
fragment HEX : [0-9a-fA-F] ;

NUMBER
    :   '-'? INT '.' [0-9]+ EXP? // 1.35, 1.35E-9, 0.3, -4.5
    |   '-'? INT EXP             // 1e10 -3e4
    |   '-'? INT                 // -3, 45
    ;

fragment INT :   '0' | [1-9] [0-9]* ; // no leading zeros
fragment EXP :   [Ee] [+\-]? INT ; // \- since - means "range" inside [...]

