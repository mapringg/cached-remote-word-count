const express = require('express')
const rp = require('request-promise')
const AsyncLock = require('async-lock')

const lock = new AsyncLock()

const helpers = require('./helpers')

const app = express()

const cache = {}

app.set('view engine', 'pug')

app.get('/wc', async (req, res, next) => {
  const url = req.query.target
  const force = req.query.force
  const accept = req.headers.accept
  lock.acquire(
    url,
    async done => {
      // async work
      if (cache[url] && (force === 'false' || force === undefined)) {
        const onlyHeaders = function(body, response, resolveWithFullResponse) {
          return {
            headers: response.headers
          }
        }
        const { headers } = await rp({
          url,
          transform: onlyHeaders
        })
        if (cache[url].etag !== headers.etag) {
          const body = await rp(url)
          return helpers.fetchNewData(
            body,
            cache,
            url,
            headers,
            res,
            accept,
            done
          )
        }
        res.setHeader('cache-data', 'true')
        done()
        return helpers.responseBasedOnType(
          url,
          res,
          accept,
          cache[url].wordCount,
          cache[url].topTenWords
        )
      }
      const { body, caseless } = await rp({
        url,
        resolveWithFullResponse: true
      })
      const headers = caseless.dict
      cache[url] = {}
      return helpers.fetchNewData(body, cache, url, headers, res, accept, done)
    },
    function(err, ret) {
      // lock released
    }
  )
})

app.listen(3000)

module.exports = app
