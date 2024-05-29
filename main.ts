import { Options } from 'k6/options';

const { opts, files, setup } = require(`./profiles/${__ENV.PROFILE}.js`);

export const options: Options = opts;

for (const [name, path] of Object.entries(files)) {
  exports[name] = require("./" + path as string).default;
}

if (setup) {
  exports.setup = setup;
}

export default function() {
}

