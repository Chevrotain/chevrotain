@{%
var LCurly = {test: function(x) {return x.type === "LCurly"; }}
var RCurly = {test: function(x) {return x.type === "RCurly"; }}

var LSquare = {test: function(x) {return x.type === "LSquare"; }}
var RSquare = {test: function(x) {return x.type === "RSquare"; }}

var Colon = {test: function(x) {return x.type === "Colon"; }}
var Comma = {test: function(x) {return x.type === "Comma"; }}

var True = {test: function(x) {return x.type === "True"; }}
var False = {test: function(x) {return x.type === "False"; }}
var Null = {test: function(x) {return x.type === "Null"; }}

var StringLiteral = {test: function(x) {return x.type === "StringLiteral"; }}
var NumberLiteral = {test: function(x) {return x.type === "NumberLiteral"; }}
%}


json ->  (object | array)


object -> %LCurly (objectItem ( %Comma objectItem):*):? %RCurly


objectItem -> %StringLiteral %Colon value


array -> %LSquare (value (%Comma value):*):? %RSquare


value ->
          %StringLiteral
        | %NumberLiteral
        | object
        | array
        | %True
        | %False
        | %Null

