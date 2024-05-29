import { Options, Scenario } from 'k6/options';
import { buildScenarios, baseNameFilter, files as profileFiles } from '../../utils/profiles.js'

const standard: Scenario = {
  executor: 'constant-arrival-rate',
  duration: '3m',
  rate: 50,
  preAllocatedVUs: 100,
  maxVUs: 750,
}

const scripts: Record<string, Scenario> = {
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
}

export const opts: Options = {
  scenarios: buildScenarios(baseNameFilter('default'), standard, scripts),
}

export const files: Record<string, any> = profileFiles

