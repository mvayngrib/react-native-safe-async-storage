
'use strict'

import {
  AsyncStorage
} from 'react-native'

import fs from 'react-native-fs'
import hash from 'md5'
import utils from './utils'

const ROOT_DIR = fs.DocumentDirectoryPath + '/fsas'
const PLACEHOLDER = '~'

let CREATE_ROOT_DIR = fs.mkdir(ROOT_DIR)

module.exports = createInstance()
exports.THRESHOLD_SIZE = 1000

/**
 * get singleton with AsyncStorage API, which uses
 *   AsyncStorage for small values
 *   react-native-fs for large ones
 *
 * @return {instance}
 */
function createInstance () {
  let fsStorage = getFSStorage()

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    multiGet,
    multiSet,
    multiRemove,
    mergeItem: notImplemented,
    multiMerge: notImplemented,
    getAllKeys: AsyncStorage.getAllKeys,
  }

  function setItem (key) {
    return multiSet([key])
  }

  function removeItem (key) {
    return multiRemove([key])
  }

  function getItem (key) {
    return multiGet([key])
      .then(pairs => {
        const val = pairs[0] ? pairs[0][1] : null
        if (val == null) throw new Error('NotFound')

        return val
      })
  }

  function clear () {
    return Promise.all([
      AsyncStorage.clear(),
      fsStorage.clear()
    ])
  }

  function multiRemove (keys) {
    return Promise.all(
      AsyncStorage.multiRemove(keys),
      fsStorage.multiRemove(keys)
    )
  }

  function multiGet (keys) {
    return AsyncStorage.multiGet(keys)
      .then(pairs => {
        const inFS = pairs.filter(([k, v]) => v === PLACEHOLDER)
          .map(pair => pair[0])

        return inFS.length ? lookupInFSAndMerge(pairs, inFS) : pairs
      })
  }

  function lookupInFSAndMerge (pairs, inFS) {
    // return fsStorage.multiGet(pairs.map(pair => pair[0]))
    return fsStorage.multiGet(inFS)
      .then(vals => {
        return pairs.map(pair => {
          return pair[1] === PLACEHOLDER
            ? [pair[0], vals.shift()]
            : pair
        })
      })
  }

  function multiSet (pairs) {
    pairs = pairs.slice()
    const inFileSystem = []
    for (var i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      if (willPutInFS(pair)) {
        inFileSystem.push(pair.slice())
        pair[1] = PLACEHOLDER
      }
    }

    return Promise.all([
      AsyncStorage.multiSet(pairs),
      fsStorage.multiSet(inFileSystem)
    ])
  }

  function getFSStorage () {
    return utils.postponeMethods({
      clear: fsClear,
      multiRemove: fsMultiRemove,
      multiGet: fsMultiGet,
      multiSet: fsMultiSet
    }, CREATE_ROOT_DIR)
  }

  function fsClear () {
    CREATE_ROOT_DIR = fs.unlink(ROOT_DIR).then(() => fs.mkdir(ROOT_DIR))
    fsStorage = getFSStorage()
    return CREATE_ROOT_DIR
  }

  function fsMultiRemove (keys) {
    return utils.allSettled(pairs.map(([key, val]) => fs.unlink(toFSKey(key), val)))
  }

  function fsMultiSet (pairs) {
    return Promise.all(pairs.map(([key, val]) => fs.writeFile(toFSKey(key), val)))
  }

  function fsMultiGet (keys) {
    return utils.allSettled(keys.map(k => fs.readFile(toFSKey(k))))
  }

  function toFSKey (key) {
    return `${ROOT_DIR}/${hash(key)}`
  }

  function willPutInFS ([key, value]) {
    return value.length > exports.THRESHOLD_SIZE
  }
}

function notImplemented () {
  throw new Error('not implemented')
}
