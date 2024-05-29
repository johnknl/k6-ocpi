import { group } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"

const example = new ExampleDataLoader("locations", "/cpo/2.1.1").load("get", Interface.SENDER, true)

export default function() {
  const query = example.url.query as { limit?: number, date_from?: string, date_to?: string }
  query.limit = 100
  delete query.date_from
  delete query.date_to


  example.assertValid()

  group("locations", () => {
    group("cpo", () => {
      group("get location list", () => {
        request(example, {
          'status is 200': (r) => r.status === 200,
        }, {
          'has items': (body) => {
            return (body.data as []).length > 0
          },
          'has exactly "limit" items': (body) => {
            return (body.data as []).length === query.limit
          },
          'is sorted by timestamp': (body) => {
            const data = body.data as any
            if (data.length == 0) {
              return false
            }
            let last = data[0].timestamp
            for (let i = 1; i < data.length; i++) {
              if (last < data[i].timestamp) {
                return false
              }
              last = data[i].timestamp
            }
            return true
          }
        })
      })
    })
  })
}

