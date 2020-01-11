const express = require('express')
const cheerio = require('cheerio')
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
  const headers = req.headers
  console.log(headers)
  lock.acquire(
    url,
    async done => {
      // async work
      if (cache[url] && (force === 'false' || force === undefined)) {
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
      const htmlString = await rp(url)
      const $ = cheerio.load(htmlString)
      const words = $('body')
        .text()
        // .match(/\b[a-z]{1,20}/gi)
        .match(/(?<![-])\b[a-zA-Z]{1,20}\b(?![-])/g)
      cache[url] = {}
      cache[url].topTenWords = helpers.extractTopTenWords(words)
      cache[url].wordCount = words.length
      res.setHeader('cache-data', 'false')
      done()
      return helpers.responseBasedOnType(
        url,
        res,
        accept,
        cache[url].wordCount,
        cache[url].topTenWords
      )
    },
    function(err, ret) {
      // lock released
    }
  )
})

app.listen(3000)

module.exports = app
