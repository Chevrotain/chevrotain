import { expect } from "chai"
import { parse } from "./graphql.js"

describe("The GraphQL Grammar", () => {
  it("can parse a simple GraphQL without errors", () => {
    const input = `
{
  hero {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
`
    const parseResult = parse(input)
    expect(parseResult.lexErrors).to.be.empty
    expect(parseResult.parseErrors).to.be.empty
  })

  it("can parse a simple GraphQL without errors #2", () => {
    const input = `
{
    human(id: "1000") {
    name
    height(unit: FOOT)
}
}
`
    const parseResult = parse(input)
    expect(parseResult.lexErrors).to.be.empty
    expect(parseResult.parseErrors).to.be.empty
  })

  it("can parse a simple GraphQL without errors #3", () => {
    const input = `
type Human implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  starships: [Starship]
  totalCredits: Int
}

type Droid implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  primaryFunction: String
}
`
    const parseResult = parse(input)
    expect(parseResult.lexErrors).to.be.empty
    expect(parseResult.parseErrors).to.be.empty
  })
})
