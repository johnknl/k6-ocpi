"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseCliOpts() {
    const args = __ENV.ARGS.trim().split(' ');
    const opts = {
        stopOnFailure: false,
        noValidate: false,
        noChecks: false
    };
    for (let i = 0; i < args.length; i++) {
        let arg = args[i].trim();
        if (arg === '') {
            continue;
        }
        switch (arg) {
            case '--no-checks':
                opts.noChecks = true;
                break;
            case '--no-validate':
                opts.noValidate = true;
                break;
            case '--stop-on-failure':
                opts.stopOnFailure = true;
                break;
            case '--filter':
                opts.testFilter = args[i + 1].trim();
                i++;
                break;
            default:
                throw new Error(`Unknown option '${arg}'`);
        }
    }
    return opts;
}
exports.default = parseCliOpts();
