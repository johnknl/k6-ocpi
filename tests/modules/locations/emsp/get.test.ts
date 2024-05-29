import { group, sleep } from "k6"
import request, { ExampleDataLoader, Interface } from "../../../utils/request.js"
import { put } from "./put.test.js"

const exLoader = new ExampleDataLoader("locations", "/emsp/2.1.1")

const examples = {
  get: exLoader.load("get", Interface.RECEIVER, true),
  get_evse: exLoader.load("get.evse", Interface.RECEIVER, true),
  get_connector: exLoader.load("get.connector", Interface.RECEIVER, true),
}

export function getLocation(id: number): any {
  let req = examples.get

  const params = req.url.pathParams as any
  params.location_id = `${id}`

  req.assertValid()

  return request(req, {
    'exists': (resp) => resp.status === 200,
  })
}

interface Connector {
  id: number
}

interface Evse {
  uid: number
  connectors: Connector[]
}

interface Location {
  id: number
  evses: Evse[]
}

export default function() {

  let locationId: number;

  group('locations', () => {
    group('emsp', () => {
      group('putting location', () => {
        locationId = put()
        // give the queue some time to process
        sleep(1)
      })

      let location: Location;

      group('getting location', () => {
        const resp = getLocation(locationId)
        const body = resp.json()
        location = body.data
      })

      group('getting evse', () => {
        const req = examples.get_evse
        const params = req.url.pathParams as any
        params.location_id = `${locationId}`
        params.evse_uid = `${location.evses[0].uid}`

        req.assertValid()

        request(req, {
          'exists': (resp) => resp.status === 200,
        }, {
          'has connectors': (body) => (body.data as any)?.connectors?.length == location.evses[0].connectors.length,
        })
      })

      group('getting connector', () => {
        const req = examples.get_connector
        const params = req.url.pathParams as any
        params.location_id = `${locationId}`
        params.evse_uid = `${location.evses[0].uid}`
        params.connector_id = `${location.evses[0].connectors[0].id}`
        req.assertValid()

        request(req, {
          'exists': (resp) => resp.status === 200,
        })
      })
    })
  })
}

