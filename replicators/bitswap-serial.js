const znode = require('znode')
const links = require('dag-cbor-links')

class AquireBlock {
  constructor (network) {
    network.forEach(arr => {
      arr.push(false)
    })

    for (let net of network) {
      let [service, client, store] = net
      let getBlock = hashString => {
        if (store.has(hashString)) {
          return store.get(hashString)
        } else {
          throw new Error('Not Found')
        }
      }
      znode(service, {getBlock})
      let promise = znode(client)
      let _getBlock = async hashString => {
        let remote = await promise
        client.busy = true
        let buff = await remote.getBlock(hashString)
        client.busy = false
        this.free(_getBlock)
        return buff
      }
      net.push(_getBlock)
    }
    this.network = network
    this.pending = []
  }
  async getBlock (cid) {
    cid = cid.multihash.toString('base64')
    for (let [, client, , , _getBlock] of this.network) {
      if (!client.busy) {
        return _getBlock(cid)
      }
    }
    return new Promise(resolve => {
      this.pending([resolve, cid])
    })
  }
  async free (getBlock) {
    if (this.pending.length) {
      let [resolve, cid] = this.pending.shift()
      resolve(getBlock(cid))
    }
  }
}

const replicator = async (root, path, network, cacheRoot, store = new Map()) => {
  let ab = new AquireBlock(network)

  let sync = async cid => {
    let data
    let cidString = cid.multihash.toString('base64')
    if (!store.has(cidString)) {
      data = await ab.getBlock(cid)
      console.log(data.length)
      store.set(cidString, data)
    } else {
      data = store.get(cidString)
    }
    let promises = []
    for (let [, link] of links(data)) {
      promises.push(sync(link))
    }
    return Promise.all(promises)
  }
  await sync(root)
}

module.exports = replicator
