import { IRuleConfig, IProduction } from "../../../../api"
import { Parser } from "../parser"

export const PROP_ANALYSER_CONTEXT = "__parserRuleAnalyserContext"

export interface IRuleDefinitionInfo<T> {
    ruleName: string
    implementation: () => any
    config?: IRuleConfig<T>
}

export class ParserRuleAnalyserContext {
    private _recordedDefinitions: IProduction[] = []
    public get recordedDefinitions() {
        return this._recordedDefinitions
    }

    public _rules: Record<string, IRuleDefinitionInfo<any>> = {}
    public get rules() {
        return this._rules
    }

    public recordDefinitions(implementation: () => void): IProduction[] {
        const old = this._recordedDefinitions.slice()

        this._recordedDefinitions = []

        implementation()

        const res = this._recordedDefinitions

        this._recordedDefinitions = old

        return res
    }

    public addToRecorded(...recorded: IProduction[]) {
        if (!this._recordedDefinitions) {
            this._recordedDefinitions = []
        }

        this._recordedDefinitions.push(...recorded)
    }
}

export interface IParserRuleAnalyser {
    [PROP_ANALYSER_CONTEXT]?: ParserRuleAnalyserContext
}
