import { group } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"
import config from "../../../../utils/config.js"
import idgen from "../../../../utils/idgen.js"

const exLoader = new ExampleDataLoader("tariffs")

const examples = {
  get: exLoader.load("get", Interface.RECEIVER, true),
  put: exLoader.load("put", Interface.RECEIVER, true),
}

export default function() {
  const id = idgen.next("tariffs", config.ids?.tariffs?.min || 0)

  group('tariffs', () => {
    group('putting tariff', () => {
      let req = examples.put

      const params = req.url.pathParams as any
      params.tariff_id = `${id}`

      req.body = Object.assign({}, req.body as {}, {
        "id": `${id}`,
      });

      req.assertValid()

      // OCPI 2.1.1, page 16, neither hub nor net are compliant
      // request(req, {
      //   'putting new object results in 201': (resp) => resp.status === 201,
      // })

      request(req, {
        'putting existing object results in 200': (resp) => resp.status === 200,
      })
    })

    group('getting tariff', () => {
      let req = examples.get

      const params = req.url.pathParams as any
      params.tariff_id = `${id}`

      req.assertValid()

      request(req, {
        'exists': (resp) => resp.status === 200,
      })
    })
  })
}

