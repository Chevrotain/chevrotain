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

export function buildModel(
  productions: Record<string, Rule>
): CstNodeTypeDefinition[] {
  const generator = new CstNodeDefinitionGenerator()
  const allRules = Object.values(productions)
  return allRules.map((rule) => generator.visitRule(rule))
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

    // Group rawElements by propertyName
    const grouped: Record<string, PropertyTupleElement[]> = {}
    rawElements.forEach((el) => {
      ;(grouped[el.propertyName] ??= []).push(el)
    })
    const properties = Object.entries(grouped).map(([propertyName, group]) => {
      const allNullable = !group.some((el) => !el.canBeNull)

      // In an alternation with a label a property name can have
      // multiple types.
      let propertyType: PropertyArrayType = group[0].type
      if (group.length > 1) {
        propertyType = group.map((g) => g.type)
      }

      return {
        name: propertyName,
        type: propertyType,
        optional: allNullable
      } as PropertyTypeDefinition
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
    return this.visitEach(definition).map(
      (definition: any) =>
        Object.assign({}, definition, override) as PropertyTupleElement
    )
  }

  private visitEach(definition: IProduction[]) {
    return ([] as PropertyTupleElement[]).concat(
      ...definition.map(
        (definition) =>
          (this as any).visit(definition) as PropertyTupleElement[]
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
