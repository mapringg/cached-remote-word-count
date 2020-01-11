const express = require('express')
const request = require('request')
const cheerio = require('cheerio')

const helpers = require('./helpers')

const app = express()

const cache = {}

const beingCalled = {}

app.set('view engine', 'pug')

// const waitForCacheData = (url, res, accept) => {
//   console.log(cache[url])
//   if (cache[url]) {
//     console.log('data is here')
//     res.setHeader('cache-data', 'true')
//     return helpers.responseBasedOnType(
//       url,
//       res,
//       accept,
//       cache[url].wordCount,
//       cache[url].topTenWords
//     )
//   } else {
//     console.log('waiting')
//     setTimeout(waitForCacheData, 100)
//   }
// }

// const waitForCacheData = url =>
//   new Promise((resolve, reject) => {
//     const check = () => {
//       console.log('checking')
//       if (cache[url]) {
//         resolve()
//       } else {
//         setTimeout(check, 100)
//       }
//     }
//   })

app.get('/wc', (req, res, next) => {
  // console.log('requesting')
  const url = req.query.target
  const force = req.query.force
  const accept = req.headers.accept
  // console.log('🤮: beingCalled', beingCalled)
  console.log('🤮: beingCalled[url]', beingCalled[url])
  if (beingCalled[url]) {
    setTimeout(() => console.log('should not block'), 100)
  }
  beingCalled[url] = true
  if (cache[url] && (force === 'false' || force === undefined)) {
    // console.log('force: false')
    res.setHeader('cache-data', 'true')
    return helpers.responseBasedOnType(
      url,
      res,
      accept,
      cache[url].wordCount,
      cache[url].topTenWords
    )
  }
  request(url, (error, response, body) => {
    // console.log('requesting')
    // console.log('force: true')
    const $ = cheerio.load(body)
    const words = $('body')
      .text()
      // .match(/\b[a-z]{1,20}/gi)
      .match(/(?<![-])\b[a-zA-Z]{1,20}\b(?![-])/g)
    cache[url] = {}
    cache[url].topTenWords = helpers.extractTopTenWords(words)
    cache[url].wordCount = words.length
    console.log('data is set')
    res.setHeader('cache-data', 'false')
    return helpers.responseBasedOnType(
      url,
      res,
      accept,
      cache[url].wordCount,
      cache[url].topTenWords
    )
  })
})

app.listen(3000)

module.exports = app
