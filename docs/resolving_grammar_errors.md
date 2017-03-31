## Resolving Grammar Errors

* [Common Prefix Ambiguities.](#COMMON_PREFIX)


### <a name="COMMON_PREFIX"></a> Common Prefix Ambiguities. 

Imagine the following grammar:

```antlr
myRule:
  "A" "B" |
  "A" "B" "C"
```

The first alternative is a prefix of the second alternative.
Now lets consider the input ["A", "B"].
For this input the first alternative would be matched as expected.
 
However for the input ["A", "B", "C"] the first
alternative would still be matched but this time **incorrectly**
as alternation matches are attempted **in order**.

There are two ways to resolve this:

* Reorder the alternatives so that shorter common prefix lookahead
  paths appears after the longer ones.
  
  ```antlr
  myRule:
    "A" "B" "C" |
    "A" "B"
  ```

* Refactor the grammar to extract common prefixes.
  ```antlr
    myRule:
      "A" "B" ("C")?
  ```
  
  
  
