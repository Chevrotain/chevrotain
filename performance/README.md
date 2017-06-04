## Parser Libraries Performance Benchmark Methodology


### What is measured? 
The intent of the benchmark is to measure the maximum parsing speed.
With Parsing is defined as: 

**The entire syntactic analysis flow excluding the execution of user actions/semantics.**

It is important to note that all the steps needed to for the users to run their actions/semantics
must be measured. This means that the grammar or implementation must **still be productive**.
For example: If a parsing library must create data structures to enable running user defined actions/semantics
then those data structures must still be created and cannot be turned off even if they are not required
for "pure" parsing, because they will be needed for the user to add their semantic actions.
 
The "maximum" part means that if a parsing library has options/flags to speed up the performance
those will be enabled if relevant.
Examples of such options/flags:
 * Chevrotain: Reducing amount location tracking information.
 * Antlr: Using SLL [prediction mode](http://www.antlr.org/api/Java/org/antlr/v4/runtime/atn/PredictionMode.html)
 * Antlr: disabling visitor pre/post hooks creation (--no-visitor CLI argument)
 * Nearley: Removing default post-processors as they will be overwritten by user custom semantics in productive scenarios.
 * Nearley: Using a Lexer (Moo).
 
 
### Grammar parity
The grammars and parser implementations used in the benchmark must be as similar to each other as possible.
This means:
 * Same rule names. (TODO...)
 * Same order of alternatives.
 * Same exact definition of the tokens.
 * ... 


### Isolation

* Each implementation will be invoked in its own separate iframe to ensure maximum isolation.


### Hand Built Parser
An Hand Built Parser is included for comparison purposes.
It is based on Douglas Crockford's [Jsonify](https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js)
recursive decent parser with the semantic actions (re-assembly of the json object) removed.


### Apples and Oranges
The benchmark **cannot** be perfectly fair:

* Some parsing libraries may always create some output structure (Parse Trees/Asts/Csts),
  other may not support any automatic data structure creation and 
  yet others may even provide capabilities to control the created Parse Tree.
  
* Some parsing libraries will not track any position information, other will track offsets only and others yet
  will track start/end lines/columns in addition to offsets.
  
This is the reasoning for the definition of the "parsing" as everything **excluding** the user defined actions.
It is very difficult if not impossible to create a completely fair benchmark, so we will have to settle
for trying to measure the maximum performance of the parsing engine.


### End to End benchmark

Another possible variant of a parsing library performance benchmark may measure the entire end to end flow
including the creation of some agreed upon data structure, for example: JSON text --> JSON Object.
This measurement may be interesting for end users, particularly as it could spot
inefficiencies in different ways to run semantic actions (visitors/walkers vs embedded actions).

However it could also be misleading as adding a (supposedly?) fixed time component to each of the bench cases
will skew the relativity of the results.

Imagine Parsing library A taking 10ms and library B taking 100ms.
A's parsing engine is clearly 10 times faster than B, yet if we add a fixed 10ms overhead to both
it is now 20ms vs 110ms, A is now just 5.5 times faster.

This kind of scenario is still interesting, and thus a pull request implementing such a benchmark will be 
very favorably reviewed.
