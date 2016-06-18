'use strict'

exports.allSettled = function allSettled (promises) {
  const vals = new Array(promises.length).fill(null)
  return new Promise(resolve => {
    let togo = vals.length
    promises.forEach(function (promise, i) {
      promise
        .then(val => vals[i] = val)
        .finally(() => {
          if (--togo === 0) resolve(vals)
        })
    })
  })
}

exports.postponeMethods = function postponeMethods (obj, promise) {
  const ensured = {}

  Object.keys(obj).forEach(k => {
    const fn = obj[k]
    ensured[k] = function (...args) {
      return promise.then(() => {
        return fn.apply(this, args)
      })
    }
  })

  return ensured
}

exports.nodeify = function nodeify (obj) {
  const nodeified = {}
  Object.keys(obj).forEach(k => {
    const fn = obj[k]
    nodeified[k] = function (...args) {
      const cb = args.pop()
      return fn.apply(this, args)
        .then(
          val => cb(null, val),
          err => cb(err)
        )
    }
  })

  return nodeified
}

exports.lockify = function lockify (obj, methods) {
  let pending = Promise.resolve()
  methods = methods || Object.keys(obj).filter(k => typeof obj[k] === 'function')
  methods.forEach(method => {
    const orig = obj[method]
    obj[method] = function (...args) {
      const newPending = pending.then(() => {
        return orig.apply(this, args)
      })

      return pending = newPending
    }
  })

  return obj
}
