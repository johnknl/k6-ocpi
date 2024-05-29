import { Scenario } from 'k6/options'
import cliOpts from "./cli.js"

const fileList = JSON.parse(open(`./../profiles/filelist.json`))

export const files: Record<string, any> = {}

export function buildScenarios(pathFilter: (filePath: string) => boolean, standard: Scenario, scripts?: Record<string, Scenario>): Record<string, Scenario> {
  const scenarios: Record<string, Scenario> = {}

  fileList.filter(pathFilter).forEach((filePath: string) => {
    const re = /^tests\/modules\/([a-zA-Z]+)\/([a-zA-Z]+)\/([a-zA-Z_]+)\.test\.js$/
    const match = re.exec(filePath)

    if (!match) {
      throw new Error(`File ${filePath} does not match the expected pattern`)
    }

    const module = match[1]
    const role = match[2]
    const scenarioName = match[3]
    const baseName = `${module}_${role}_${scenarioName}`

    if (cliOpts.testFilter && !baseName.match(cliOpts.testFilter)) {
      return
    }

    let scenario = standard

    if (scripts && scripts[baseName]) {
      scenario = scripts[baseName]
    }

    scenarios[baseName] = Object.assign({}, scenario, { exec: baseName })
    files[baseName] = filePath
  })

  if (Object.keys(scenarios).length === 0) {
    throw new Error('No scenarios found')
  }

  return scenarios
}

export function compositeFilter(...filters: ((file: string) => boolean)[]): (file: string) => boolean {
  return (file) => filters.every((filter) => filter(file))
}

export function roleFilter(role: string): (file: string) => boolean {
  return (file) => !!file.match(new RegExp(`${role}\/[^\/]*test\.js$`))
}

export function moduleFilter(module: string): (file: string) => boolean {
  return (file) => !!file.match(new RegExp(`modules\/${module}\/[^\/]*test\.js$`))
}

export function scenarioFilter(scenario: string): (file: string) => boolean {
  return (file) => !!file.match(new RegExp(`${scenario}\.test\.js$`))
}

export function baseNameFilter(baseName: string): (file: string) => boolean {
  return (file) => !!file.match(new RegExp(`${baseName}\.test\.js$`))
}
