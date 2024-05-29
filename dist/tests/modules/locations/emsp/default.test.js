"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const patch_test_js_1 = __importDefault(require("./patch.test.js"));
const put_test_js_1 = __importDefault(require("./put.test.js"));
const get_test_js_1 = __importDefault(require("./get.test.js"));
function default_1() {
    (0, put_test_js_1.default)();
    (0, get_test_js_1.default)();
    (0, patch_test_js_1.default)();
}
exports.default = default_1;
