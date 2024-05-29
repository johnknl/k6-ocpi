import { Options } from 'k6/options';
import { buildScenarios, baseNameFilter, files as profileFiles } from '../utils/profiles.js'

export const opts: Options = {
  scenarios: buildScenarios(baseNameFilter('default'), {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 1,
    maxDuration: '1m',
  })
}

export const files: Record<string, any> = profileFiles


