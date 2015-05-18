###The Why?
Parser Generators are rarely used to build commercial grade compilers/editors/tools.
   
[As Terence Parr said:](https://theantlrguy.atlassian.net/wiki/pages/viewpage.action?pageId=1900547) 

  1. "A: In my experience, almost no one uses parser generators to build commercial compilers. 
      So, people are using ANTLR for their everyday work, building everything from configuration files to little 
      scripting languages."
  2. "I believe that compiler developers are very concerned with parsing speed, error reporting, 
      and error recovery. For that, they want absolute control over their parser."
   
So Parser generators can provide simplicity and ease of use, but at the cost of:
 
1. control.
2. speed (sometimes).
3. functionality (depends on the specific parser generator features).
   
writing a recursive decent parser by hand can solve some of the above issues but with its owns costs such as:

1. Easy of use, also know as: "mind numbing manual repetitive labour".
2. functionality (how often does a hand built parser include strong fault tolerance capabilities...).

 
Chevrotain tries to bridge the gap between these two approaches.
providing as much of the control and performance of hand built parsers and as much of the ease of use of parser generators. with some advanced functionality thrown in for good measure.
   
   
The Parsing DSL is the best example for this:
   
   * The DSL allows writing more declarative grammar rule than an hand built parser (although not as declarative as a BNF grammar) --> **easy of use**
   * This has minimal impact on performance because the DSL is not interpreted by some engine in the background,
     the DSL runs as normal code and can be debugged and stepped through normally. --> **performance** + **ease of debugging**
   * Such an approach may be good for performance and ease of use, but what about functionality? 
     the grammar structure(**Introspection**) must be known for providing advanced features such as error recovery, 
     syntactic content assist, automatically generated grammar documentation... without a code generation phase or an interpreter for the DSL, 
     how can the grammar's structure be understood? this is solved by self analysis(calling Function.toString()) on the parsing rules to extract the grammar's structure,
     which is done only once per grammar. --> **functionality** + **performance**
   
   * what about **control**?  
     as said earlier, what you write is what will be run, 
     this automatically provides more control as there is no code generation phase in the middle that does "god knows what" with your code... 
     in addition hooks are provided to override certain behaviors, for example: which tokens can be automatically inserted during single token insertion recovery.
     or perhaps you've split up a grammar into three different files and want to mix them all in to create your parser? that too can be done,
     it is not even a concern of the framework it is simply the advantage of writing plain javascript code that one has "nearly" full control of. --> **control**