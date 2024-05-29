import { group, sleep } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"
import { put } from "./put.test.js"

const exLoader = new ExampleDataLoader("locations", "/emsp/2.1.1")

const examples = {
  get: exLoader.load("get", Interface.RECEIVER, true),
  patch: exLoader.load("patch", Interface.RECEIVER, true),
  patch_evse: exLoader.load("patch.evse", Interface.RECEIVER, true),
  patch_connector: exLoader.load("patch.connector", Interface.RECEIVER, true),
}

export default function () {
  let id: number;
  return;

  group('locations', () => {
    group('emsp', () => {
      group('putting location', () => {
        id = put()
        // give the queue some time to process
        sleep(1)
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

      group('patching location', () => {
        let req = examples.patch
        let params = req.url.pathParams as any
        params.location_id = `${id}`

        req.assertValid()

        request(req, {
          'updating location results in 200': (resp) => resp.status === 200,
        })

        // assert the resulting location has the same number of locations
        req = examples.get

        params = req.url.pathParams as any
        params.location_id = `${id}`

        req.assertValid()

        request(req, {}, {
          'location updated': (body) => (body.data as any).address === "F.Rooseveltlaan 3B",
        })
      })
      group('patching evse', () => {
        let req = examples.patch_evse

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
      //
      //   let params = req.url.pathParams as any
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

