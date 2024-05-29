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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocation = void 0;
const k6_1 = require("k6");
const request_js_1 = __importStar(require("../../../utils/request.js"));
const put_test_js_1 = require("./put.test.js");
const exLoader = new request_js_1.ExampleDataLoader("locations", "/emsp/2.1.1");
const examples = {
    get: exLoader.load("get", request_js_1.Interface.RECEIVER, true),
    get_evse: exLoader.load("get.evse", request_js_1.Interface.RECEIVER, true),
    get_connector: exLoader.load("get.connector", request_js_1.Interface.RECEIVER, true),
};
function getLocation(id) {
    let req = examples.get;
    const params = req.url.pathParams;
    params.location_id = `${id}`;
    req.assertValid();
    return (0, request_js_1.default)(req, {
        'exists': (resp) => resp.status === 200,
    });
}
exports.getLocation = getLocation;
function default_1() {
    let locationId;
    (0, k6_1.group)('locations', () => {
        (0, k6_1.group)('emsp', () => {
            (0, k6_1.group)('putting location', () => {
                locationId = (0, put_test_js_1.put)();
                // give the queue some time to process
                (0, k6_1.sleep)(1);
            });
            let location;
            (0, k6_1.group)('getting location', () => {
                const resp = getLocation(locationId);
                const body = resp.json();
                location = body.data;
            });
            (0, k6_1.group)('getting evse', () => {
                const req = examples.get_evse;
                const params = req.url.pathParams;
                params.location_id = `${locationId}`;
                params.evse_uid = `${location.evses[0].uid}`;
                req.assertValid();
                (0, request_js_1.default)(req, {
                    'exists': (resp) => resp.status === 200,
                }, {
                    'has connectors': (body) => { var _a, _b; return ((_b = (_a = body.data) === null || _a === void 0 ? void 0 : _a.connectors) === null || _b === void 0 ? void 0 : _b.length) == location.evses[0].connectors.length; },
                });
            });
            (0, k6_1.group)('getting connector', () => {
                const req = examples.get_connector;
                const params = req.url.pathParams;
                params.location_id = `${locationId}`;
                params.evse_uid = `${location.evses[0].uid}`;
                params.connector_id = `${location.evses[0].connectors[0].id}`;
                req.assertValid();
                (0, request_js_1.default)(req, {
                    'exists': (resp) => resp.status === 200,
                });
            });
        });
    });
}
exports.default = default_1;
