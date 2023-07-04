import type {
  Alternation,
  Alternative,
  IProduction,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal,
  TokenType
} from "@chevrotain/types"
import { NonTerminal, GAstVisitor } from "@chevrotain/gast"
import { map } from "@chevrotain/utils"
import { forEachObj } from "@chevrotain/utils"
import { flatten } from "@chevrotain/utils"
import { values } from "remeda/dist/commonjs/values"
import { some } from "@chevrotain/utils"
import { groupBy } from "remeda/dist/commonjs/groupBy"
import { merge } from "remeda/dist/commonjs/merge"

export function buildModel(
  productions: Record<string, Rule>
): CstNodeTypeDefinition[] {
  const generator = new CstNodeDefinitionGenerator()
  const allRules = values(productions)
  return map(allRules, (rule) => generator.visitRule(rule))
}

export type CstNodeTypeDefinition = {
  name: string
  properties: PropertyTypeDefinition[]
}

export type PropertyTypeDefinition = {
  name: string
  type: PropertyArrayType
  optional: boolean
}

export type PropertyArrayType =
  | TokenArrayType
  | RuleArrayType
  | (TokenArrayType | RuleArrayType)[]

export type TokenArrayType = { kind: "token" }
export type RuleArrayType = {
  kind: "rule"
  name: string
}

class CstNodeDefinitionGenerator extends GAstVisitor {
  visitRule(node: Rule): CstNodeTypeDefinition {
    const rawElements = this.visitEach(node.definition)
    const grouped = groupBy(rawElements, (el) => el.propertyName)

    const properties: PropertyTypeDefinition[] = []
    forEachObj(grouped, (group, propertyName) => {
      const allNullable = !some(group, (el) => !el.canBeNull)

      // In an alternation with a label a property name can have
      // multiple types.
      let propertyType: PropertyArrayType = group[0].type
      if (group.length > 1) {
        propertyType = map(group, (g) => g.type)
      }

      properties.push({
        name: propertyName as string,
        type: propertyType,
        optional: allNullable
      })
    })

    return {
      name: node.name,
      properties: properties
    }
  }

  visitAlternative(node: Alternative) {
    return this.visitEachAndOverrideWith(node.definition, { canBeNull: true })
  }

  visitOption(node: Option) {
    return this.visitEachAndOverrideWith(node.definition, { canBeNull: true })
  }

  visitRepetition(node: Repetition) {
    return this.visitEachAndOverrideWith(node.definition, { canBeNull: true })
  }

  visitRepetitionMandatory(node: RepetitionMandatory) {
    return this.visitEach(node.definition)
  }

  visitRepetitionMandatoryWithSeparator(
    node: RepetitionMandatoryWithSeparator
  ) {
    return this.visitEach(node.definition).concat({
      propertyName: node.separator.name,
      canBeNull: true,
      type: getType(node.separator)
    })
  }

  visitRepetitionWithSeparator(node: RepetitionWithSeparator) {
    return this.visitEachAndOverrideWith(node.definition, {
      canBeNull: true
    }).concat({
      propertyName: node.separator.name,
      canBeNull: true,
      type: getType(node.separator)
    })
  }

  visitAlternation(node: Alternation) {
    return this.visitEachAndOverrideWith(node.definition, { canBeNull: true })
  }

  visitTerminal(node: Terminal): PropertyTupleElement[] {
    return [
      {
        propertyName: node.label || node.terminalType.name,
        canBeNull: false,
        type: getType(node)
      }
    ]
  }

  visitNonTerminal(node: NonTerminal): PropertyTupleElement[] {
    return [
      {
        propertyName: node.label || node.nonTerminalName,
        canBeNull: false,
        type: getType(node)
      }
    ]
  }

  private visitEachAndOverrideWith(
    definition: IProduction[],
    override: Partial<PropertyTupleElement>
  ) {
    return map(this.visitEach(definition), (definition) =>
      merge(definition, override)
    )
  }

  private visitEach(definition: IProduction[]): PropertyTupleElement[] {
    return flatten(
      map(
        definition,
        (definition) => this.visit(definition) as PropertyTupleElement[]
      )
    )
  }
}

type PropertyTupleElement = {
  propertyName: string
  canBeNull: boolean
  type: TokenArrayType | RuleArrayType
}

function getType(
  production: Terminal | NonTerminal | TokenType
): TokenArrayType | RuleArrayType {
  if (production instanceof NonTerminal) {
    return {
      kind: "rule",
      name: production.referencedRule.name
    }
  }

  return { kind: "token" }
}
