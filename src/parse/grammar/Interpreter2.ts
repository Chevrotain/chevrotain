/// <reference path="../../scan/Tokens.ts" />
/// <reference path="../../parse/grammar/GAst.ts" />
/// <reference path="../../parse/grammar/Rest.ts" />
/// <reference path="../../parse/grammar/First.ts" />
/// <reference path="../../parse/grammar/Path.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.parse.grammar.interpreter {

    import t = chevrotain.scan.tokens;
    import g = chevrotain.parse.grammar.gast;
    import f = chevrotain.parse.grammar.first;
    import r = chevrotain.parse.grammar.rest;
    import p = chevrotain.parse.grammar.path;

    export class NextPossibleTokensWalker extends r.RestWalker {

        private possibleTokTypes:Function[] = [];
        private ruleStack:string[];
        private occurrenceStack:number[];

        private nextTerminalName = "";
        private nextTerminalOccurrence = 0;
        private nextProductionName = "";
        private nextProductionOccurrence = 0;
        private found = false;

        constructor(private topProd:g.TOP_LEVEL, private path:p.IGrammarPath) {super(); }

        startWalking():Function[] {

            this.found = false;
            if (this.path === p.NO_PATH_FOUND()) {
                throw Error("Can't walk an INVALID path!");
            }

            if (this.path.ruleStack[0] !== this.topProd.name) {
                throw Error("The path does not start with the walker's top Rule!");
            }

            // immutable for the win
            this.ruleStack = (<any>_.clone(this.path.ruleStack)).reverse(); // intelij bug requires assertion
            this.occurrenceStack = (<any>_.clone(this.path.occurrenceStack)).reverse(); // intelij bug requires assertion

            // already verified that the first production is valid, we now seek the 2nd production
            this.ruleStack.pop();
            this.occurrenceStack.pop();

            this.updateExpectedNext();
            this.walk(this.topProd);

            return this.possibleTokTypes;
        }


        walk(prod:g.AbstractProduction, prevRest:gast.IProduction[] = []):void {
            // stop scanning once we found the path
            if (!this.found) {
                super.walk(prod, prevRest);
            }
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            if (t.getTokName(terminal.terminalType) === this.nextTerminalName &&
                terminal.occurrenceInParent === this.nextTerminalOccurrence && !(this.found)
            ) {
                var fullRest = currRest.concat(prevRest);
                var restProd = new g.FLAT(fullRest);
                // yey we know what comes after the path and can now compute it's FIRST
                this.possibleTokTypes = f.first(restProd, true);
                this.found = true;
            }
        }

        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // found the next production, need to keep walking in it
            if (refProd.ref.name === this.nextProductionName &&
                refProd.occurrenceInParent === this.nextProductionOccurrence
            ) {
                var fullRest = currRest.concat(prevRest);
                this.updateExpectedNext();
                this.walk(refProd.ref, fullRest);
            }
        }

        updateExpectedNext():void {
            // need to consume the Terminal
            if (_.isEmpty(this.ruleStack)) {
                this.nextTerminalName = t.getTokName(this.path.lastTok);
                this.nextTerminalOccurrence = this.path.lastTokOccurrence;

                // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
                // really seeking is the last Terminal...
                this.nextProductionName = "";
                this.nextProductionOccurrence = 0;
            }
            else {
                this.nextProductionName = this.ruleStack.pop();
                this.nextProductionOccurrence = this.occurrenceStack.pop();
            }

        }
    }
}
