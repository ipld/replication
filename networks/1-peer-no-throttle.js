const {createClientServer} = require('../lib/util')

module.exports = async store => {
  let [server, client] = await createClientServer()
  return [[server, client]]
}
