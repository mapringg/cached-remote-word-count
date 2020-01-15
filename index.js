const express = require('express')
const request = require('request')
const AsyncLock = require('async-lock')

const lock = new AsyncLock()

const helpers = require('./helpers')

const app = express()

const cache = {}

const errorUrls = {}

app.set('view engine', 'pug')

app.use((req, res, next) => {
  if (Object.keys(errorUrls).length > 10) {
    errorUrls = {}
  }
  if (Object.keys(cache).length > 50) {
    const oldestToNewestCacheKeys = Object.keys(cache).sort(function(a, b) {
      return cache[a].last_updated - cache[b].last_updated
    })
    const deleteCacheKey = oldestToNewestCacheKeys.slice(
      0,
      oldestToNewestCacheKeys.length / 2
    )
    for (key of deleteCacheKey) {
      delete cache[`${key}`]
    }
  }
  next()
})

app.get('/wc', async (req, res, next) => {
  console.log('requesting')
  const url = req.query.target
  const force = req.query.force
  const accept = req.headers.accept
  lock.acquire(
    url,
    async done => {
      // async work
      if (cache[url] && (force === 'false' || force === undefined)) {
        console.log('from cache')
        if (new Date().getTime() > cache[url].time + 1000 * 60) {
          request(url, function(error, response, body) {
            if (error) {
              errorUrls[url] = true
              done()
              return res.status(404).render('404')
            }
            const headers = response.headers
            if (cache[url].etag !== headers.etag) {
              console.log('etag has been changed')
              res.setHeader('etag-changed', 'true')
              helpers.parseNewData(body, cache, url, headers, res, accept, done)
            } else {
              console.log('etag did not changed')
              helpers.returnOldData(res, done, url, accept, cache)
            }
          })
        } else {
          console.log('call made within 1 minutes')
          helpers.returnOldData(res, done, url, accept, cache)
        }
      } else {
        console.log('not from cache')
        request(url, function(error, response, body) {
          if (error) {
            errorUrls[url] = true
            done()
            return res.status(404).render('404')
          }
          console.log('data fetched')
          const headers = response.headers
          cache[url] = {}
          res.setHeader('etag-changed', 'new')
          helpers.parseNewData(body, cache, url, headers, res, accept, done)
        })
      }
    },
    function(err, ret) {
      // lock released
      console.log('lock.isBusy(url)', lock.isBusy(url))
      if (lock.isBusy(url) && errorUrls[url]) {
        return res.status(404).render('404')
      } else if (!lock.isBusy(url)) {
        errorUrls[url] = false
      }
    }
  )
})

app.listen(3000)

module.exports = app
