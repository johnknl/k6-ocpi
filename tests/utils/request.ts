import loadSchema from "k6/x/jsonschema"
import http, { RequestBody, RefinedParams, RefinedResponse } from "k6/http"
import { Checkers, check } from "k6"
import config from "../../utils/config.js"
import exec from "k6/execution"
import cliOpts from "../../utils/cli.js"
import { newHS256 } from "k6/x/jwt"

const responseSchema = loadSchema(`./_data/schema/ocpi/response.${config.ocpi.version.replace(/\./g, '_')}.json`)
const requestSchema = loadSchema(`./_data/schema/ocpi/request.${config.ocpi.version.replace(/\./g, '_')}.json`)

export interface RequestData {
  method: string
  url: {
    scheme: string
    host: string
    path: string
    pathParams?: Record<string, string>
    query?: Record<string, string>
  }
  headers?: Record<string, string>
  body?: any
}

export interface ExampleDataProperties {
  name: string
  module: string
  version: string
  iface: string
  valid: boolean
}

export class RequestURL {
  host: string
  path: string
  scheme: string
  pathParams?: Record<string, string>
  query?: Record<string, string | number>


  constructor(scheme: string, host: string, path: string, pathParams?: Record<string, string>, query?: Record<string, string>) {
    this.scheme = scheme
    this.host = host
    this.path = path
    this.pathParams = pathParams
    this.query = query
  }

  toString(): string {
    let path = this.path
    if (this.pathParams) {
      for (let k in this.pathParams) {
        path = path.replace(`{${k}}`, this.pathParams[k])
      }
    }
    let str = `${this.scheme}://${this.host}${path}`
    if (this.query) {
      str += "?" + Object.entries(this.query).map(([k, v]) => `${k}=${v}`).join("&")
    }

    return str
  }
}

export enum Interface {
  SENDER = "sender",
  RECEIVER = "receiver",
}

export class ExampleDataLoader {
  module: string
  version: string
  basePath?: string

  constructor(module: string, basePath?: string) {
    this.module = module
    this.version = config.ocpi.version
    if (config.ocpi.basePath) {
      this.basePath = config.ocpi.basePath + (basePath || "")
    }
  }

  load(name: string, iface: Interface, valid: boolean): Request {
    const validStr = valid ? "valid" : "invalid"
    const path = `./../../../../../_data/examples/${this.module}/${this.version}/${validStr}/${iface}/request/${name}.json`

    let example = JSON.parse(open(path))
    example.url = Object.assign({}, config.server, example.url)
    if (this.basePath) {
      example.url.path = this.basePath + example.url.path
    }

    return Request.fromData(example)
  }
}

export class Request {
  method: string
  url: RequestURL
  body?: RequestBody | null
  params?: RefinedParams<"text"> | null

  constructor(method: string, url: RequestURL, body?: RequestBody | null, params?: RefinedParams<"text"> | null) {
    this.method = method
    this.url = url
    this.body = body
    this.params = params
  }

  toData(): RequestData {
    const o = {
      method: this.method,
      url: {
        scheme: this.url.scheme,
        host: this.url.host,
        path: this.url.path,
      },
      headers: this.params?.headers,
    }

    if (this.body) {
      (o as any).body = this.body
    }

    if (this.url.query) {
      (o.url as any).query = this.url.query
    }

    if (this.url.pathParams) {
      (o.url as any).pathParams = this.url.pathParams
    }

    return o
  }

  assertValid(): void {
    if (cliOpts.noValidate) {
      return
    }

    const err = requestSchema.validate(this.toData())
    if (err) {
      console.log(JSON.stringify(this.toData(), null, 2))
      exec.test.abort("request is not valid according to schema: \n" + err.toString() + "\n")
    }
  }

  static fromData(req: RequestData): Request {
    return new Request(
      req.method,
      new RequestURL(
        req.url.scheme,
        req.url.host,
        req.url.path,
        req.url.pathParams,
        req.url.query
      ),
      req.body,
      { headers: req.headers, tags: { name: `${req.method}:${req.url.path}` } },
    )
  }
}

export interface OCPIBody {
  status_code?: number
  status_message?: string
  last_updated?: string
  data?: {} | []
}

export default function request(
  req: Request,
  responseChecks?: Checkers<RefinedResponse<"text">>,
  bodyChecks?: Checkers<OCPIBody>
): RefinedResponse<"text"> {

  // generic callback is not supported by k6 (yet)
  http.setResponseCallback(http.expectedStatuses({ min: 100, max: 500 }));

  req.params = req.params || {}
  req.params.headers = req.params.headers || {}
  if (config.jwt?.claims) {
    req.params.headers["Authorization"] = `Bearer ${newHS256("secret", config.jwt.claims)}`
  } else {
    if (config.ocpi?.tokens?.cpo && req.url.path.match(/\/cpo/)) {
      let token = __ENV[config.ocpi.tokens.cpo]
      req.params.headers["Authorization"] = `Token ${token}`
    }
    if (config.ocpi?.tokens?.emsp && req.url.path.match(/\/e?msp/)) {
      let token = __ENV[config.ocpi.tokens.emsp]
      req.params.headers["Authorization"] = `Token ${token}`
    }
  }

  const resp = http.request(
    req.method,
    req.url.toString(),
    JSON.stringify(req.body),
    req.params || {},
  )

  if (cliOpts.noChecks) {
    return resp
  }

  let json: OCPIBody = {};
  let msgPrefix = `requesting ${req.method} ${req.url}: `

  if (!check(resp, {
    "body is JSON": (r) => {
      try {
        json = r.json() as unknown as OCPIBody
        return true
      } catch (e) {
        return false
      }
    }
  })) {
    if (cliOpts.stopOnFailure) {
      exec.test.abort("response body is not JSON")
    }

    return resp
  }

  const response = {
    status: resp.status,
    headers: Object.keys(resp.headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = resp.headers[key].toLowerCase();
      return acc;
    }, {} as { [key: string]: string }),
    body: json,
    request: req.toData(),
  }


  if (!cliOpts.noValidate) {
    check(responseSchema.validate(response), {
      "JSON is valid according to schema":
        (v) => v === null || checkAbort(msgPrefix + "\n" + v.toString() + "\n"),
    })
  }

  if (responseChecks) {
    try {
      if (!check(resp, responseChecks)) {
        throw new Error("response checks failed")
      }
    } catch (e) {
      checkAbort(msgPrefix + ((e as any).message || "unknown error"))
    }
  }

  if (bodyChecks) {
    try {
      if (!check(json, bodyChecks)) {
        throw new Error("body checks failed")
      }
    } catch (e) {
      checkAbort(msgPrefix + ((e as any).message || "unknown error"))
    }
  }

  return resp
}

function checkAbort(msg: string): boolean {
  if (cliOpts.stopOnFailure) {
    exec.test.abort(msg)
  }
  return false
}

