let { runner } = require('./lib/util')

let createData = require('./data/shallow-100n-tiny')
let createNetwork = require('./networks/1-peer-no-throttle')
let replicator = require('./replicators/bitswap-serial')

runner(createData, createNetwork, replicator).then(r => console.log(r))
