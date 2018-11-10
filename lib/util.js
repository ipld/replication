const net = require('net')
const getport = require('get-port')
const cbor = require('dag-cbor-sync')()

const createClientServer = async () => {
  let port = await getport()
  return new Promise((resolve, reject) => {
    let client
    let server = net.createServer(socket => {
      resolve([socket, client])
    })
    server.listen(port, err => {
      if (err) return reject(err)
      client = net.connect(port)
    })
  })
}

const run = async (createData, createNetwork, replicator, serializer = cbor.mkblock) => {
  let [store, root, paths, cacheRoot, cacheStore] = await createData(serializer)
  let network = await createNetwork(store)
  network.forEach(arr => arr.push(store))
  let results = {}
  for (let path of paths) {
    let start = Date.now()
    await replicator(root, path, network, cacheRoot, cacheStore)
    let end = Date.now()
    results[path] = (end - start)
  }
  return results
}

exports.createClientServer = createClientServer
exports.runner = run
