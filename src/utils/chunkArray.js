const chunkArray = (array, size) => {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, size + i))
  }
  return result
}

module.exports = {
  chunkArray,
}
