import { Options } from 'k6/options';
import { buildScenarios, baseNameFilter, files as profileFiles, compositeFilter, roleFilter } from '../../utils/profiles.js'

export const opts: Options = {
  scenarios: buildScenarios(
    compositeFilter(
      baseNameFilter('put_stress'),
      roleFilter('emsp'),
    ), {
    executor: 'constant-arrival-rate',
    duration: '1m',
    rate: 300,
    preAllocatedVUs: 1000,
    maxVUs: 1500,
  })
}

export const files: Record<string, any> = profileFiles


