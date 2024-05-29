"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = exports.opts = void 0;
const profiles_js_1 = require("../utils/profiles.js");
exports.opts = {
    scenarios: (0, profiles_js_1.buildScenarios)((0, profiles_js_1.baseNameFilter)('put'), {
        executor: 'shared-iterations',
        vus: 1,
        iterations: 1,
        maxDuration: '1m',
    })
};
exports.files = profiles_js_1.files;
