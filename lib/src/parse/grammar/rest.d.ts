import { AbstractProduction, Alternation, Flat, NonTerminal, Option, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Terminal } from "./gast/gast_public";
import { IProduction } from "../../../api";
/**
 *  A Grammar Walker that computes the "remaining" grammar "after" a productions in the grammar.
 */
export declare abstract class RestWalker {
    walk(prod: AbstractProduction, prevRest?: any[]): void;
    walkTerminal(terminal: Terminal, currRest: IProduction[], prevRest: IProduction[]): void;
    walkProdRef(refProd: NonTerminal, currRest: IProduction[], prevRest: IProduction[]): void;
    walkFlat(flatProd: Flat, currRest: IProduction[], prevRest: IProduction[]): void;
    walkOption(optionProd: Option, currRest: IProduction[], prevRest: IProduction[]): void;
    walkAtLeastOne(atLeastOneProd: RepetitionMandatory, currRest: IProduction[], prevRest: IProduction[]): void;
    walkAtLeastOneSep(atLeastOneSepProd: RepetitionMandatoryWithSeparator, currRest: IProduction[], prevRest: IProduction[]): void;
    walkMany(manyProd: Repetition, currRest: IProduction[], prevRest: IProduction[]): void;
    walkManySep(manySepProd: RepetitionWithSeparator, currRest: IProduction[], prevRest: IProduction[]): void;
    walkOr(orProd: Alternation, currRest: IProduction[], prevRest: IProduction[]): void;
}
