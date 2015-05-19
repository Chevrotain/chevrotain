/// <reference path="gast.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.validations {

    import gast = chevrotain.gast

    export class GrammarError implements Error {

        public get message() :string {
            return getProductionDslName(this.refs[0]) + " with occurence number " + (<any>this.refs[0]).occurrenceInParent +
                " appears " + this.refs.length + " times in " + this.topLevelRule.name
                + " with the same occurrence number"
        }

        //In order to show the message in the printed error in the console
        public toString() :string {
            return this.name + ": " + this.message
        }

        constructor(public refs: gast.IProduction[],
                    public topLevelRule: gast.TOP_LEVEL,
                    public name: string = "Occurrence Number Error" ) {
        }
    }

    export function validateGrammar(topLevels:gast.TOP_LEVEL[]): GrammarError[] {
        var errorsArrays = _.map(topLevels, (topLevel) => {
            var collectorVisitor = new OccurrenceValidationCollector()
            topLevel.accept(collectorVisitor)
           return validateOccurrenceUsageInProductions(collectorVisitor.allProductions, topLevel)
        })

        return _.flatten<GrammarError>(errorsArrays)
    }

    export function getProductionDslName(prod: gast.IProduction) {
        if (prod instanceof gast.Terminal) {
            return "CONSUME"
        } else if ( prod instanceof  gast.ProdRef) {
            return "SUBRULE"
        } else {
            return lang.functionName((<any>prod).constructor)
        }
    }

    export function getRelevantProductionArgument(prod: gast.IProduction, defaultProductionArgument: string = "...") {
        if (prod instanceof gast.Terminal) {
            return lang.functionName((<gast.Terminal>prod).terminalType)
        } else if ( prod instanceof  gast.ProdRef) {
            return (<gast.ProdRef>prod).refProdName
        } else {
            return defaultProductionArgument
        }
    }

    export function identifyProductionForDuplicates(prod: gast.IProduction) {
        return getProductionDslName(prod) + (<any>prod).occurrenceInParent + "(" + getRelevantProductionArgument(prod) + ")"
    }

    export function productionOccurrenceErrorGenerator(prods:gast.IProduction[], topLevelRule:gast.TOP_LEVEL) : GrammarError {
        //All the productions should be of the same type and they have the same occurrence number
        var representativeProduction = prods[0]
        return new GrammarError(prods, topLevelRule)
    }

    export function validateOccurrenceUsageInProductions(productions:gast.IProduction[], topLevel:gast.TOP_LEVEL) : GrammarError[] {
        var groups = _.groupBy(productions, identifyProductionForDuplicates)

        //Cannot use _.filter because groups is an object of arrays and not an array
        var errors = []
        _.forEach(groups, function(groupValues, groupKey) {
            if (groupValues.length > 1) {
                errors.push(productionOccurrenceErrorGenerator(groupValues, topLevel))
            }
        })

        return errors
    }

    export class OccurrenceValidationCollector extends gast.GAstVisitor {
        public allProductions : gast.IProduction[]= []

        public visitProdRef(subrule:gast.ProdRef):void {
            this.allProductions.push(subrule)
        }

        public visitOPTION(option:gast.OPTION):void {
            this.allProductions.push(option)
        }

        public visitAT_LEAST_ONE(atLeastOne:gast.AT_LEAST_ONE):void {
            this.allProductions.push(atLeastOne)
        }

        public visitMANY(many:gast.MANY):void {
            this.allProductions.push(many)
        }

        public visitOR(or:gast.OR):void {
            this.allProductions.push(or)
        }

        public visitTerminal(terminal:gast.Terminal):void {
            this.allProductions.push(terminal)
        }

    }

}
