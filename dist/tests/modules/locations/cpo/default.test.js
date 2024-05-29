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
const k6_1 = require("k6");
const request_js_1 = __importStar(require("../../../utils/request.js"));
const example = new request_js_1.ExampleDataLoader("locations", "/cpo/2.1.1").load("get", request_js_1.Interface.SENDER, true);
function default_1() {
    const query = example.url.query;
    query.limit = 100;
    delete query.date_from;
    delete query.date_to;
    example.assertValid();
    (0, k6_1.group)("locations", () => {
        (0, k6_1.group)("cpo", () => {
            (0, k6_1.group)("get location list", () => {
                (0, request_js_1.default)(example, {
                    'status is 200': (r) => r.status === 200,
                }, {
                    'has items': (body) => {
                        return body.data.length > 0;
                    },
                    'has exactly "limit" items': (body) => {
                        return body.data.length === query.limit;
                    },
                    'is sorted by timestamp': (body) => {
                        const data = body.data;
                        if (data.length == 0) {
                            return false;
                        }
                        let last = data[0].timestamp;
                        for (let i = 1; i < data.length; i++) {
                            if (last < data[i].timestamp) {
                                return false;
                            }
                            last = data[i].timestamp;
                        }
                        return true;
                    }
                });
            });
        });
    });
}
exports.default = default_1;
