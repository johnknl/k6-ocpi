const properties = JSON.parse(open("../../properties.json"))

interface Properties {
  server: {
    host: string
    path: string
  },
  ocpi: {
    version: string
    basePath?: string
    tokens: {
      cpo: string
      emsp: string
    }
  },
  jwt: {
    claims: any
  },
  ids?: {
    locations?: {
      min?: number
    },
    tariffs?: {
      min?: number
    }
  }
}

export default properties as Properties
