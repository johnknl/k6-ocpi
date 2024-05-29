"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = exports.opts = void 0;
const profiles_js_1 = require("../../utils/profiles.js");
exports.opts = {
    scenarios: (0, profiles_js_1.buildScenarios)((0, profiles_js_1.compositeFilter)((0, profiles_js_1.baseNameFilter)('put_stress'), (0, profiles_js_1.roleFilter)('emsp')), {
        executor: 'constant-arrival-rate',
        duration: '1m',
        rate: 300,
        preAllocatedVUs: 1000,
        maxVUs: 1500,
    })
};
exports.files = profiles_js_1.files;
