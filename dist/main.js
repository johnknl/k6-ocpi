"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
const { opts, files, setup } = require(`./profiles/${__ENV.PROFILE}.js`);
exports.options = opts;
for (const [name, path] of Object.entries(files)) {
    exports[name] = require("./" + path).default;
}
if (setup) {
    exports.setup = setup;
}
function default_1() {
}
exports.default = default_1;
