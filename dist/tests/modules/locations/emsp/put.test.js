"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const k6_1 = require("k6");
const request_js_1 = __importStar(require("../../../utils/request.js"));
const config_js_1 = __importDefault(require("../../../../utils/config.js"));
const idgen_js_1 = __importDefault(require("../../../../utils/idgen.js"));
const exLoader = new request_js_1.ExampleDataLoader("locations", "/emsp/2.1.1");
const examples = {
    get: exLoader.load("get", request_js_1.Interface.RECEIVER, true),
    put: exLoader.load("put", request_js_1.Interface.RECEIVER, true),
    put_evse: exLoader.load("put.evse", request_js_1.Interface.RECEIVER, true),
    put_connector: exLoader.load("put.connector", request_js_1.Interface.RECEIVER, true),
};
function put() {
    var _a, _b;
    const id = idgen_js_1.default.next("locations", ((_b = (_a = config_js_1.default.ids) === null || _a === void 0 ? void 0 : _a.locations) === null || _b === void 0 ? void 0 : _b.min) || 0);
    let req = examples.put;
    const params = req.url.pathParams;
    params.location_id = `${id}`;
    req.body = Object.assign({}, req.body, {
        "id": `${id}`,
    });
    req.assertValid();
    // OCPI 2.1.1, page 16
    (0, request_js_1.default)(req, {
        'putting new object results in 201': (resp) => resp.status === 201,
    });
    (0, request_js_1.default)(req, {
        'putting existing object results in 200': (resp) => resp.status === 200,
    });
    return id;
}
exports.put = put;
function default_1() {
    let id;
    (0, k6_1.group)('locations', () => {
        (0, k6_1.group)('emsp', () => {
            (0, k6_1.group)('putting location', () => {
                id = put();
            });
            (0, k6_1.group)('getting location', () => {
                let req = examples.get;
                const params = req.url.pathParams;
                params.location_id = `${id}`;
                req.assertValid();
                (0, request_js_1.default)(req, {
                    'exists': (resp) => resp.status === 200,
                }, {
                    'evse has correct length': (body) => body.data.evses.length === 2,
                });
            });
            (0, k6_1.group)('updating evse', () => {
                let req = examples.put_evse;
                let params = req.url.pathParams;
                params.location_id = `${id}`;
                req.body = Object.assign({}, req.body, {
                    "status": "RESERVED",
                });
                req.assertValid();
                (0, request_js_1.default)(req, {
                    'updating evse results in 200': (resp) => resp.status === 200,
                });
                // assert the resulting location has the same number of locations
                req = examples.get;
                params = req.url.pathParams;
                params.location_id = `${id}`;
                req.assertValid();
                (0, request_js_1.default)(req, {}, {
                    'evse updated in place': (body) => { var _a; return ((_a = body.data.evses) === null || _a === void 0 ? void 0 : _a.length) === 2; },
                    'evse status updated': (body) => { var _a; return ((_a = body.data.evses[1]) === null || _a === void 0 ? void 0 : _a.status) === "RESERVED"; }
                });
            });
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
        });
    });
}
exports.default = default_1;
