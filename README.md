# K6 OCPI

Wrapper and some OCPI-specific (load) test cases for K6.
Does request and reply validation using bundled JSON-schema.

Incomplete test cases, but you can use them as examples and add your own.

### Synopsys

```
Usage: ./run [run options] [profile=default] [script options] -- [k6 options]

Run options:
  --build     Build k6 with extensions before running the script.
  --no-tsc    Skip TypeScript compilation (will always skip if 'tsc' or 'npm' are not available).
  --no-list   Skip generating test file list (will always skip if 'node' or 'npm' are not available).

Default profiles:
  default           Runs all 'default.test.js' scripts exactly once (1 VU, 1 iteration).
  default/stress    Runs same scripts as 'default' many times concurrently.

Additional profiles can be found / placed in the \`profiles\` directory.

Script options:
  --filter           Filter scenarios by name (matches partials, eg 'loc').
  --stop-on-failure  Abort k6 on first failed check (best effort).
                     This will also add schema validation messages to
                     k6 abort message.
  --no-checks        Don't do any response checks (implies --no-validate).
  --no-validate      Skip request and response schema validation
                     (reduces client side load).

K6 options:
  Refer to ./bin/k6 run -h for all available options.
```
