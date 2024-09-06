const fs = require("fs")
const path = require("path")

function findFiles(baseDirectories, pattern) {
  const files = []

  function traverse(dir) {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const itemPath = path.join(dir, item)
      const stats = fs.statSync(itemPath)

      if (stats.isDirectory()) {
        traverse(itemPath)
      } else if (stats.isFile() && item.endsWith(pattern)) {
        files.push(itemPath)
      }
    }
  }

  for (const directory of baseDirectories) {
    traverse(directory)
  }

  return files
}

module.exports = { findFiles }
