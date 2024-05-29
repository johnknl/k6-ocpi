import { group, sleep } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"
import config from "../../../../utils/config.js"
import idgen from "../../../../utils/idgen.js"
import exec from "k6/execution"

const exLoader = new ExampleDataLoader("locations", "/emsp/2.1.1")

const examples = {
  get: exLoader.load("get", Interface.RECEIVER, true),
  put: exLoader.load("put", Interface.RECEIVER, true),
  put_evse: exLoader.load("put.evse", Interface.RECEIVER, true),
  put_connector: exLoader.load("put.connector", Interface.RECEIVER, true),
}

export function put(): number {
  const id = idgen.next("locations", config.ids?.locations?.min || 0)
  let req = examples.put

  const params = req.url.pathParams as any
  params.location_id = `${id}`

  req.body = Object.assign({}, req.body as {}, {
    "id": `${id}`,
  });

  // OCPI 2.1.1, page 16
  request(req, {
    'putting new object results in 201': (resp) => resp.status === 201,
  })

  request(req, {
    'putting existing object results in 200': (resp) => resp.status === 200,
  })

  return id
}

export default function () {

  let id: number;

  group('locations', () => {
    group('emsp', () => {
      group('putting location', () => {
        id = put()
      })

      group('updating evse', () => {
        for (let i = 0; i < 100; i++) {
          let req = examples.put_evse
          let params = req.url.pathParams as any
          params.location_id = `${id}`
          params.evse_uid = `${i}`
          req.body = Object.assign({}, req.body as {}, {
            "status": "RESERVED",
          });

          request(req, {
            'updating evse results in 200': (resp) => resp.status === 200,
          })
        }
      })
    })
  })
}

