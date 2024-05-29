"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = exports.ExampleDataLoader = exports.Interface = exports.RequestURL = void 0;
const jsonschema_1 = __importDefault(require("k6/x/jsonschema"));
const http_1 = __importDefault(require("k6/http"));
const k6_1 = require("k6");
const config_js_1 = __importDefault(require("../../utils/config.js"));
const execution_1 = __importDefault(require("k6/execution"));
const cli_js_1 = __importDefault(require("../../utils/cli.js"));
const jwt_1 = require("k6/x/jwt");
const responseSchema = (0, jsonschema_1.default)(`./_data/schema/ocpi/response.${config_js_1.default.ocpi.version.replace(/\./g, '_')}.json`);
const requestSchema = (0, jsonschema_1.default)(`./_data/schema/ocpi/request.${config_js_1.default.ocpi.version.replace(/\./g, '_')}.json`);
class RequestURL {
    constructor(scheme, host, path, pathParams, query) {
        this.scheme = scheme;
        this.host = host;
        this.path = path;
        this.pathParams = pathParams;
        this.query = query;
    }
    toString() {
        let path = this.path;
        if (this.pathParams) {
            for (let k in this.pathParams) {
                path = path.replace(`{${k}}`, this.pathParams[k]);
            }
        }
        let str = `${this.scheme}://${this.host}${path}`;
        if (this.query) {
            str += "?" + Object.entries(this.query).map(([k, v]) => `${k}=${v}`).join("&");
        }
        return str;
    }
}
exports.RequestURL = RequestURL;
var Interface;
(function (Interface) {
    Interface["SENDER"] = "sender";
    Interface["RECEIVER"] = "receiver";
})(Interface || (exports.Interface = Interface = {}));
class ExampleDataLoader {
    constructor(module, basePath) {
        this.module = module;
        this.version = config_js_1.default.ocpi.version;
        if (config_js_1.default.ocpi.basePath) {
            this.basePath = config_js_1.default.ocpi.basePath + (basePath || "");
        }
    }
    load(name, iface, valid) {
        const validStr = valid ? "valid" : "invalid";
        const path = `./../../../../../_data/examples/${this.module}/${this.version}/${validStr}/${iface}/request/${name}.json`;
        let example = JSON.parse(open(path));
        example.url = Object.assign({}, config_js_1.default.server, example.url);
        if (this.basePath) {
            example.url.path = this.basePath + example.url.path;
        }
        return Request.fromData(example);
    }
}
exports.ExampleDataLoader = ExampleDataLoader;
class Request {
    constructor(method, url, body, params) {
        this.method = method;
        this.url = url;
        this.body = body;
        this.params = params;
    }
    toData() {
        var _a;
        const o = {
            method: this.method,
            url: {
                scheme: this.url.scheme,
                host: this.url.host,
                path: this.url.path,
            },
            headers: (_a = this.params) === null || _a === void 0 ? void 0 : _a.headers,
        };
        if (this.body) {
            o.body = this.body;
        }
        if (this.url.query) {
            o.url.query = this.url.query;
        }
        if (this.url.pathParams) {
            o.url.pathParams = this.url.pathParams;
        }
        return o;
    }
    assertValid() {
        if (cli_js_1.default.noValidate) {
            return;
        }
        const err = requestSchema.validate(this.toData());
        if (err) {
            console.log(JSON.stringify(this.toData(), null, 2));
            execution_1.default.test.abort("request is not valid according to schema: \n" + err.toString() + "\n");
        }
    }
    static fromData(req) {
        return new Request(req.method, new RequestURL(req.url.scheme, req.url.host, req.url.path, req.url.pathParams, req.url.query), req.body, { headers: req.headers, tags: { name: `${req.method}:${req.url.path}` } });
    }
}
exports.Request = Request;
function request(req, responseChecks, bodyChecks) {
    var _a, _b, _c, _d, _e;
    // generic callback is not supported by k6 (yet)
    http_1.default.setResponseCallback(http_1.default.expectedStatuses({ min: 100, max: 500 }));
    req.params = req.params || {};
    req.params.headers = req.params.headers || {};
    if ((_a = config_js_1.default.jwt) === null || _a === void 0 ? void 0 : _a.claims) {
        req.params.headers["Authorization"] = `Bearer ${(0, jwt_1.newHS256)("secret", config_js_1.default.jwt.claims)}`;
    }
    else {
        if (((_c = (_b = config_js_1.default.ocpi) === null || _b === void 0 ? void 0 : _b.tokens) === null || _c === void 0 ? void 0 : _c.cpo) && req.url.path.match(/\/cpo/)) {
            let token = __ENV[config_js_1.default.ocpi.tokens.cpo];
            req.params.headers["Authorization"] = `Token ${token}`;
        }
        if (((_e = (_d = config_js_1.default.ocpi) === null || _d === void 0 ? void 0 : _d.tokens) === null || _e === void 0 ? void 0 : _e.emsp) && req.url.path.match(/\/e?msp/)) {
            let token = __ENV[config_js_1.default.ocpi.tokens.emsp];
            req.params.headers["Authorization"] = `Token ${token}`;
        }
    }
    const resp = http_1.default.request(req.method, req.url.toString(), JSON.stringify(req.body), req.params || {});
    if (cli_js_1.default.noChecks) {
        return resp;
    }
    let json = {};
    let msgPrefix = `requesting ${req.method} ${req.url}: `;
    if (!(0, k6_1.check)(resp, {
        "body is JSON": (r) => {
            try {
                json = r.json();
                return true;
            }
            catch (e) {
                return false;
            }
        }
    })) {
        if (cli_js_1.default.stopOnFailure) {
            execution_1.default.test.abort("response body is not JSON");
        }
        return resp;
    }
    const response = {
        status: resp.status,
        headers: Object.keys(resp.headers).reduce((acc, key) => {
            acc[key.toLowerCase()] = resp.headers[key].toLowerCase();
            return acc;
        }, {}),
        body: json,
        request: req.toData(),
    };
    if (!cli_js_1.default.noValidate) {
        (0, k6_1.check)(responseSchema.validate(response), {
            "JSON is valid according to schema": (v) => v === null || checkAbort(msgPrefix + "\n" + v.toString() + "\n"),
        });
    }
    if (responseChecks) {
        try {
            if (!(0, k6_1.check)(resp, responseChecks)) {
                throw new Error("response checks failed");
            }
        }
        catch (e) {
            checkAbort(msgPrefix + (e.message || "unknown error"));
        }
    }
    if (bodyChecks) {
        try {
            if (!(0, k6_1.check)(json, bodyChecks)) {
                throw new Error("body checks failed");
            }
        }
        catch (e) {
            checkAbort(msgPrefix + (e.message || "unknown error"));
        }
    }
    return resp;
}
exports.default = request;
function checkAbort(msg) {
    if (cli_js_1.default.stopOnFailure) {
        execution_1.default.test.abort(msg);
    }
    return false;
}
