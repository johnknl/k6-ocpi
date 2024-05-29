import file from "k6/x/fs"

const filePath = "/tmp/k6-ocpi-ids.json"

class IDGenerator {
  next(namespace: string, min?: number): number {
    let num: number = 0;
    let json: Record<string, number> = {}

    file.update(filePath, (data: string) => {
      min = min || 1

      try {
        json = JSON.parse(data)
      } catch (e) {
        console.log("Error parsing JSON data: " + e)
        json = {}
      }

      if (typeof json !== "object") {
        console.log("JSON data is not an object")
        json = {}
      }

      if (json[namespace] === undefined || json[namespace] < min) {
        json[namespace] = min
      } else {
        json[namespace]++
      }

      num = json[namespace]

      return JSON.stringify(json).trim()
    })

    return num
  }

}

export default new IDGenerator()
