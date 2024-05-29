import * as fs from 'fs'
import * as path from 'path'

function scanDirectory(dir: string, pattern: RegExp, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      scanDirectory(filePath, pattern, fileList)
      return
    }

    if (pattern.test(file)) {
      fileList.push(path.relative('./dist', filePath))
    }
  })

  return fileList
}

const testFiles = scanDirectory('./dist/tests', /test\.js$/)

fs.writeFileSync(`./dist/profiles/filelist.json`, JSON.stringify(testFiles, null, 2))

console.log('Found test files:', testFiles.length)
