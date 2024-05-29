"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = exports.opts = void 0;
const profiles_js_1 = require("../../utils/profiles.js");
const standard = {
    executor: 'constant-arrival-rate',
    duration: '3m',
    rate: 50,
    preAllocatedVUs: 100,
    maxVUs: 750,
};
const scripts = {
    'locations_cpo_default': {
        executor: 'constant-arrival-rate',
        duration: '3m',
        rate: 10,
        preAllocatedVUs: 3,
        maxVUs: 100,
    },
    'locations_emsp_default': {
        executor: 'constant-arrival-rate',
        duration: '1m',
        rate: 250,
        preAllocatedVUs: 250,
        maxVUs: 500,
    }
};
exports.opts = {
    scenarios: (0, profiles_js_1.buildScenarios)((0, profiles_js_1.baseNameFilter)('default'), standard, scripts),
};
exports.files = profiles_js_1.files;
