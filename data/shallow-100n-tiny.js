module.exports = async serialize => {
  const store = new Map()
  let i = 0
  let parts = []
  while (i < 100) {
    let block = await serialize({test: Math.random()})
    store.set(block.cid.multihash.toString('base64'), block.data)
    parts.push(block.cid)
    i++
  }
  let root = await serialize({parts})
  store.set(root.cid.multihash.toString('base64'), root.data)
  return [store, root.cid, ['/', '/parts']]
}
