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

  req.assertValid()

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

      group('getting location', () => {
        let req = examples.get

        const params = req.url.pathParams as any
        params.location_id = `${id}`

        req.assertValid()

        request(req, {
          'exists': (resp) => resp.status === 200,
        }, {
          'evse has correct length': (body) => (body.data as any).evses.length === 2,
        })
      })

      group('updating evse', () => {
        let req = examples.put_evse
        let params = req.url.pathParams as any
        params.location_id = `${id}`
        req.body = Object.assign({}, req.body as {}, {
          "status": "RESERVED",
        });

        req.assertValid()

        request(req, {
          'updating evse results in 200': (resp) => resp.status === 200,
        })

        // assert the resulting location has the same number of locations
        req = examples.get

        params = req.url.pathParams as any
        params.location_id = `${id}`

        req.assertValid()

        request(req, {}, {
          'evse updated in place': (body) => (body.data as any).evses?.length === 2,
          'evse status updated': (body) => (body.data as any).evses[1]?.status === "RESERVED"
        })
      })


      // group('updating connector', () => {
      //   let req = examples.put_connector
      //   let prams = req.url.pathParams as any
      //   params.location_id = `${id}`
      //
      //   let body
      //   if (config.ocpi?.version === "2.2.1") {
      //     body = Object.assign({}, req.body as {}, {
      //       "tariff_ids": [
      //         "40"
      //       ],
      //     });
      //   } else {
      //     body = Object.assign({}, req.body as {}, {
      //       "tariff_id": "40",
      //     });
      //   }
      //
      //   req.body = body as unknown as RequestBody
      //
      //   req.assertValid()
      //
      //   request(req, {
      //     'updating location results in 200': (resp) => resp.status === 200,
      //   })
      //
      //   // assert the resulting location has the same number of locations
      //   req = examples.get
      //
      //   params = req.url.pathParams as any
      //   params.location_id = `${id}`
      //
      //   req.assertValid()
      //
      //   request(req, {}, {
      //     'connector updated in place': (body) => (body.data as any).evses[1]?.connectors?.length === 1,
      //     'connector tariff updated': (body) => {
      //       let actual = (body.data as any).evses[1]?.connectors[0]?.tariff_ids
      //       return JSON.stringify(actual) === JSON.stringify(["40"])
      //     },
      //   })
      // })
    })
  })
}

