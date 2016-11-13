## Separation of grammar and semantic actions
 
* terminal and noneTerminal names must be unique! add validation 
* nested rules for DSL methods.

* custom names for nested rules.
  -  ```JavaScript
     $.OPTION("items", function() {
                $.SUBRULE($.value);
                $.MANY("values", function() {
                    // allow multiple nesting levels???
                    $.OPTION("prefix", function() {
                      $.CONSUME(Dollar);
                    }) 
                    $.CONSUME(Comma);
                    $.SUBRULE2($.value);
                });
            });
     ```       
  - performance impact/mitigation for multiple args support due to the names arg being first
  
  - unique name per OR alternative
  
  - validations 
    - duplicate custom names?
    
* activating semantics directly on nested rules using package namespace
  "items$values"
    
    
* Nested rules:
 - Full name includes top REAL rule name.
 - Full name is always two levels deep.
 - name must not conflict with other terminal/NonTerminal names used in the **same** rule.
 - Support multiple nesting
 - Key which acts as shortname for nested rules, use same as lookahead keys.  
  
       
