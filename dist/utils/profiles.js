"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseNameFilter = exports.scenarioFilter = exports.moduleFilter = exports.roleFilter = exports.compositeFilter = exports.buildScenarios = exports.files = void 0;
const cli_js_1 = __importDefault(require("./cli.js"));
const fileList = JSON.parse(open(`./../profiles/filelist.json`));
exports.files = {};
function buildScenarios(pathFilter, standard, scripts) {
    const scenarios = {};
    fileList.filter(pathFilter).forEach((filePath) => {
        const re = /^tests\/modules\/([a-zA-Z]+)\/([a-zA-Z]+)\/([a-zA-Z_]+)\.test\.js$/;
        const match = re.exec(filePath);
        if (!match) {
            throw new Error(`File ${filePath} does not match the expected pattern`);
        }
        const module = match[1];
        const role = match[2];
        const scenarioName = match[3];
        const baseName = `${module}_${role}_${scenarioName}`;
        if (cli_js_1.default.testFilter && !baseName.match(cli_js_1.default.testFilter)) {
            return;
        }
        let scenario = standard;
        if (scripts && scripts[baseName]) {
            scenario = scripts[baseName];
        }
        scenarios[baseName] = Object.assign({}, scenario, { exec: baseName });
        exports.files[baseName] = filePath;
    });
    if (Object.keys(scenarios).length === 0) {
        throw new Error('No scenarios found');
    }
    return scenarios;
}
exports.buildScenarios = buildScenarios;
function compositeFilter(...filters) {
    return (file) => filters.every((filter) => filter(file));
}
exports.compositeFilter = compositeFilter;
function roleFilter(role) {
    return (file) => !!file.match(new RegExp(`${role}\/[^\/]*test\.js$`));
}
exports.roleFilter = roleFilter;
function moduleFilter(module) {
    return (file) => !!file.match(new RegExp(`modules\/${module}\/[^\/]*test\.js$`));
}
exports.moduleFilter = moduleFilter;
function scenarioFilter(scenario) {
    return (file) => !!file.match(new RegExp(`${scenario}\.test\.js$`));
}
exports.scenarioFilter = scenarioFilter;
function baseNameFilter(baseName) {
    return (file) => !!file.match(new RegExp(`${baseName}\.test\.js$`));
}
exports.baseNameFilter = baseNameFilter;
