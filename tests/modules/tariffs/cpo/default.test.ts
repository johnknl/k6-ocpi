import { group } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"

const example = new ExampleDataLoader("tariffs").load("get", Interface.SENDER, true)

export default function() {
  const query = example.url.query as { limit?: number, date_from?: string, date_to?: string }
  query.limit = 100
  delete query.date_from
  delete query.date_to

  example.assertValid()

  group("tariffs", () => {
    group("get tariff list", () => {
      request(example, {}, {
        'has items': (body) => {
          return (body.data as []).length > 0
        },
        'has at most "limit" items': (body) => {
          return (body.data as []).length > 0
        },
      })
    })
  })
}

